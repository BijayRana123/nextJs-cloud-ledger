import dbConnect from '@/lib/dbConnect';
import { Ledger, LedgerGroup } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });

    // Check if basic accounts already exist
    const existingAccounts = await Ledger.find({ organization: orgId }).limit(1);
    if (existingAccounts.length > 0) {
      return NextResponse.json({ message: 'Basic accounts already exist' }, { status: 200 });
    }

    // Ensure ledger groups exist
    let groups = await LedgerGroup.find({ organization: orgId }).lean();
    if (groups.length === 0) {
      const DEFAULT_GROUPS = [
        'Capital Account', 'Current Assets', 'Current Liabilities', 'Fixed Assets', 'Investments',
        'Loans (Liability)', 'Misc. Expenses (Asset)', 'Suspense Account', 'Branch/Divisions',
        'Reserves & Surplus', 'Secured Loans', 'Unsecured Loans', 'Bank Accounts', 'Cash-in-Hand',
        'Deposits (Asset)', 'Duties & Taxes', 'Provisions', 'Accounts Payable', 'Accounts Receivable',
        'Sales Account', 'Purchase Account', 'Direct Expenses', 'Indirect Expenses',
        'Direct Incomes', 'Indirect Incomes'
      ];
      
      await LedgerGroup.insertMany(DEFAULT_GROUPS.map((name, index) => ({ 
        name, 
        code: (1000 + (index * 100)).toString(), // Generate codes: 1000, 1100, 1200, etc.
        organization: orgId 
      })));
      groups = await LedgerGroup.find({ organization: orgId }).lean();
    }

    // Create basic accounts
    const basicAccounts = [
      { name: 'Cash', groupName: 'Cash-in-Hand', description: 'Cash on hand' },
      { name: 'Bank Account', groupName: 'Bank Accounts', description: 'Main bank account' },
      { name: 'Sales Revenue', groupName: 'Sales Account', description: 'Revenue from sales' },
      { name: 'Office Expenses', groupName: 'Direct Expenses', description: 'General office expenses' },
      { name: 'Owner Capital', groupName: 'Capital Account', description: 'Owner\'s capital investment' }
    ];

    const createdAccounts = [];
    
    for (const account of basicAccounts) {
      // Find the group
      const group = groups.find(g => g.name === account.groupName);
      if (!group) {
        console.warn(`Group ${account.groupName} not found for account ${account.name}`);
        continue;
      }

      // Create the ledger
      try {
        // Generate ledger code based on group code
        const baseCode = parseInt(group.code);
        const existingLedgers = await Ledger.find({ 
          group: group._id, 
          organization: orgId,
          code: { $exists: true, $ne: null }
        }).select('code').lean();
        
        const usedLedgerCodes = existingLedgers.map(l => parseInt(l.code)).filter(code => !isNaN(code));
        let newLedgerCode = baseCode + 1;
        while (usedLedgerCodes.includes(newLedgerCode)) {
          newLedgerCode++;
        }

        const ledger = await Ledger.create({
          name: account.name,
          code: newLedgerCode.toString(),
          group: group._id,
          description: account.description,
          openingBalance: 0,
          organization: orgId,
        });
        createdAccounts.push(ledger);
      } catch (error) {
        console.error(`Failed to create account ${account.name}:`, error);
      }
    }

    return NextResponse.json({ 
      message: `Created ${createdAccounts.length} basic accounts`,
      accounts: createdAccounts 
    });

  } catch (error) {
    console.error('Error setting up basic accounts:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}