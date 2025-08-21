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

export async function POST(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    
    // Check if groups already exist
    const existingGroups = await LedgerGroup.find({ organization: orgId }).lean();
    if (existingGroups.length > 0) {
      return NextResponse.json({ 
        message: 'Ledger groups already exist', 
        groups: existingGroups 
      });
    }
    
    // Create default groups with codes
    const defaultGroups = DEFAULT_GROUPS.map((name, index) => ({ 
      name, 
      code: (1000 + (index * 100)).toString(), // Generate codes: 1000, 1100, 1200, etc.
      organization: orgId 
    }));
    await LedgerGroup.insertMany(defaultGroups);
    
    const groups = await LedgerGroup.find({ organization: orgId }).lean();
    
    return NextResponse.json({ 
      message: `Successfully created ${groups.length} default ledger groups`,
      groups 
    });
  } catch (error) {
    console.error('Error creating ledger groups:', error);
    return NextResponse.json({ 
      error: 'Failed to create ledger groups', 
      details: error.message 
    }, { status: 500 });
  }
}