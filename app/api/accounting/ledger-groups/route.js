import dbConnect from '@/lib/dbConnect';
import { LedgerGroup } from '@/lib/models';
import { NextResponse } from 'next/server';

const DEFAULT_GROUPS = [
  'Capital Account', 'Current Assets', 'Current Liabilities', 'Fixed Assets', 'Investments',
  'Loans (Liability)', 'Misc. Expenses (Asset)', 'Suspense Account', 'Branch/Divisions',
  'Reserves & Surplus', 'Secured Loans', 'Unsecured Loans', 'Bank Accounts', 'Cash-in-Hand',
  'Deposits (Asset)', 'Duties & Taxes', 'Provisions', 'Accounts Payable', 'Accounts Receivable',
  'Sales Account', 'Purchase Account', 'Direct Expenses', 'Indirect Expenses',
  'Direct Incomes', 'Indirect Incomes'
];

export async function GET(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    
    let groups = await LedgerGroup.find({ organization: orgId }).lean();
    if (groups.length === 0) {
      // Use atomic upsert operations to handle race conditions
      try {
        console.log('No ledger groups found for organization:', orgId, 'Creating default groups...');
        
        // Create groups one by one using upsert to handle race conditions
        const createdGroups = [];
        for (let i = 0; i < DEFAULT_GROUPS.length; i++) {
          const name = DEFAULT_GROUPS[i];
          const code = (1000 + (i * 100)).toString();
          
          try {
            const group = await LedgerGroup.findOneAndUpdate(
              { name, organization: orgId },
              { 
                name, 
                code, 
                organization: orgId 
              },
              { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true 
              }
            );
            createdGroups.push(group);
          } catch (upsertError) {
            // If there's still a duplicate key error, just find the existing one
            if (upsertError.code === 11000) {
              const existingGroup = await LedgerGroup.findOne({ name, organization: orgId });
              if (existingGroup) {
                createdGroups.push(existingGroup);
              }
            } else {
              throw upsertError;
            }
          }
        }
        
        groups = createdGroups;
        console.log('Successfully ensured', groups.length, 'default ledger groups exist');
      } catch (insertError) {
        console.error('Error seeding default ledger groups:', insertError);
        console.error('Insert error details:', insertError.message);
        
        // As a fallback, try to fetch any groups that might have been created
        groups = await LedgerGroup.find({ organization: orgId }).lean();
        if (groups.length === 0) {
          return NextResponse.json({ 
            error: 'Failed to create default ledger groups', 
            details: insertError.message,
            groups: [] 
          }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error in ledger groups GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const exists = await LedgerGroup.findOne({ name: body.name, organization: orgId });
  if (exists) return NextResponse.json({ error: 'Group already exists' }, { status: 409 });
  // Generate a code for the new LedgerGroup
  const existingGroupCodes = await LedgerGroup.find({ 
    organization: orgId, 
    code: { $exists: true, $ne: null } 
  }).select('code').lean();
  
  const usedCodes = existingGroupCodes.map(g => parseInt(g.code)).filter(code => !isNaN(code));
  let newGroupCode = 1000;
  while (usedCodes.includes(newGroupCode)) {
    newGroupCode += 100;
  }

  const group = await LedgerGroup.create({
    name: body.name,
    code: body.code || newGroupCode.toString(),
    parent: body.parent || null,
    description: body.description || '',
    organization: orgId,
  });
  return NextResponse.json({ group });
} 
