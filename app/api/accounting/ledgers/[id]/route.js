import dbConnect from '@/lib/dbConnect';
import { Ledger } from '@/lib/models';
import { NextResponse } from 'next/server';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';

export async function GET(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const { id } = await params;
  
  // First try to find as a Ledger
  let ledger = await Ledger.findOne({ _id: id, organization: orgId }).populate('group').lean();
  let coa = null;
  
  if (!ledger) {
    // If not found as Ledger, try to find as ChartOfAccount
    coa = await ChartOfAccount.findOne({ _id: id, organization: orgId }).lean();
    if (!coa) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Create a ledger-like object from ChartOfAccount
    ledger = {
      _id: coa._id,
      name: coa.name,
      code: coa.code,
      description: coa.description || '',
      openingBalance: 0, // TODO: Calculate from transactions
      organization: coa.organization,
      group: null // ChartOfAccount doesn't have groups
    };
  }

  // If we don't have a ChartOfAccount yet, find or create one
  if (!coa) {
    const groupName = ledger.group?.name || 'Misc';
    const code = `${groupName}:${ledger.name}`;
    
    // First try to find existing account by various combinations
    coa = await ChartOfAccount.findOne({
      $or: [
        { code, organization: orgId },
        { name: ledger.name, organization: orgId, path: { $regex: new RegExp(ledger.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }
      ]
    });
    
    if (!coa) {
      // Generate path: GroupName:LedgerName
      const path = `${groupName}:${ledger.name}`;
      // Guess type and subtype from group name (simple heuristic)
      let type = 'asset';
      let subtype = 'current';
      if (/liab/i.test(groupName)) { type = 'liability'; subtype = 'current_liability'; }
      if (/revenue|income|sales/i.test(groupName)) { type = 'revenue'; subtype = 'operating_revenue'; }
      if (/expense/i.test(groupName)) { type = 'expense'; subtype = 'operating_expense'; }
      if (/equity/i.test(groupName)) { type = 'equity'; subtype = 'capital'; }
      if (/cash/i.test(ledger.name)) { type = 'asset'; subtype = 'current'; }
      
      // Try multiple approaches to prevent duplicate key errors
      try {
        // First attempt: try with the original code
        coa = await ChartOfAccount.findOneAndUpdate(
          { code, organization: orgId },
          {
            $setOnInsert: {
              name: ledger.name,
              path,
              type,
              code,
              subtype,
              organization: orgId,
              active: true,
            }
          },
          { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
          }
        );
      } catch (error) {
        if (error.code === 11000) {
          // If duplicate key error, try to find existing account with similar criteria
          coa = await ChartOfAccount.findOne({
            $or: [
              { code, organization: orgId },
              { name: ledger.name, organization: orgId },
              { path, organization: orgId }
            ]
          });
          
          // If still not found, generate a unique code
          if (!coa) {
            let uniqueCode = code;
            let counter = 1;
            
            while (!coa) {
              try {
                uniqueCode = `${code}_${counter}`;
                coa = await ChartOfAccount.findOneAndUpdate(
                  { code: uniqueCode, organization: orgId },
                  {
                    $setOnInsert: {
                      name: ledger.name,
                      path,
                      type,
                      code: uniqueCode,
                      subtype,
                      organization: orgId,
                      active: true,
                    }
                  },
                  { 
                    new: true, 
                    upsert: true,
                    setDefaultsOnInsert: true
                  }
                );
                break;
              } catch (innerError) {
                if (innerError.code === 11000) {
                  counter++;
                  if (counter > 100) { // Prevent infinite loop
                    throw new Error('Unable to create unique chart of account code');
                  }
                } else {
                  throw innerError;
                }
              }
            }
          }
        } else {
          throw error;
        }
      }
    }
  }
  return NextResponse.json({ ledger, chartOfAccount: { _id: coa._id, path: coa.path } });
}

export async function PUT(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const { id } = await params;
  const { name, group, description, openingBalance } = await request.json();
  if (!name || !group) return NextResponse.json({ error: 'Name and group required' }, { status: 400 });
  const ledger = await Ledger.findOneAndUpdate(
    { _id: id, organization: orgId },
    { name, group, description, openingBalance: openingBalance || 0 },
    { new: true }
  );
  if (!ledger) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ledger });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const { id } = await params;
  const ledger = await Ledger.findOneAndDelete({ _id: id, organization: orgId });
  if (!ledger) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
} 