import dbConnect from '@/lib/dbConnect';
import { Ledger } from '@/lib/models';
import { NextResponse } from 'next/server';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';

export async function GET(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
const { id } = await params;
  const ledger = await Ledger.findOne({ _id: id, organization: orgId }).populate('group').lean();
  if (!ledger) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Find or create ChartOfAccount for this ledger
  const groupName = ledger.group?.name || 'Misc';
  const code = `${groupName}:${ledger.name}`;
  let coa = await ChartOfAccount.findOne({ code, organization: orgId, name: ledger.name });
  if (!coa) {
    // Generate path: GroupName:LedgerName
    const path = `${groupName}:${ledger.name}`;
    // Guess type and subtype from group name (simple heuristic)
    let type = 'asset';
    let subtype = 'current';
    if (/liab/i.test(groupName)) { type = 'liability'; subtype = 'current_liability'; }
    if (/revenue|income/i.test(groupName)) { type = 'revenue'; subtype = 'operating_revenue'; }
    if (/expense/i.test(groupName)) { type = 'expense'; subtype = 'operating_expense'; }
    if (/equity/i.test(groupName)) { type = 'equity'; subtype = 'capital'; }
    
    // Use findOneAndUpdate with upsert to prevent duplicate key errors
    try {
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
      // Fallback error handling in case upsert still fails
      if (error.code === 11000) {
        return NextResponse.json({ error: 'Duplicate key error: code already exists' }, { status: 409 });
      }
      throw error;
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