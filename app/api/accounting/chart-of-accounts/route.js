import dbConnect from '@/lib/dbConnect';
import { Ledger, LedgerGroup } from '@/lib/models';
import { NextResponse } from 'next/server';
import AccountingTransaction from '@/lib/models/AccountingTransaction';

export async function GET(request) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });

  // Fetch all groups and ledgers
  const groups = await LedgerGroup.find({ organization: orgId }).lean();
  const ledgers = await Ledger.find({ organization: orgId }).populate('group').lean();
    
  // Helper to build the full account path for a ledger
  function buildLedgerPath(ledger, groups) {
    let pathParts = [];
    let currentGroup = groups.find(g => g._id.toString() === (ledger.group?._id?.toString() || ledger.group?.toString()));
    while (currentGroup) {
      pathParts.unshift(currentGroup.name);
      currentGroup = groups.find(g => g._id.toString() === (currentGroup.parent ? currentGroup.parent.toString() : null));
    }
    pathParts.push(ledger.name);
    return pathParts.join(":");
  }

  // Compute balances for each ledger
  const ledgersWithBalances = await Promise.all(ledgers.map(async (ledger) => {
    const accountPath = ledger.path || buildLedgerPath(ledger, groups);
    const transactions = await AccountingTransaction.find({
      account_path: accountPath,
      organization: orgId
    });
    let balance = 0;
    for (const txn of transactions) {
      if (txn.debit) {
        balance += txn.amount;
      } else if (txn.credit) {
        balance -= txn.amount;
      }
    }

    return { ...ledger, path: accountPath, balance };
  }));

  // Compute balances for each group (sum of all child ledgers' balances)
  const groupBalances = {};
  for (const group of groups) {
    // Find all ledgers whose path starts with this group's name
    const groupPath = group.name;
    const childLedgers = ledgersWithBalances.filter(l => l.path && l.path.startsWith(groupPath + ':'));
    const groupBalance = childLedgers.reduce((sum, l) => sum + (l.balance || 0), 0);
    groupBalances[group._id] = groupBalance;

  }


  // Return both groups (with balances) and ledgers with balances for frontend rendering
  return NextResponse.json({ success: true, groups: groups.map(g => ({ ...g, balance: groupBalances[g._id] || 0 })), ledgers: ledgersWithBalances });
}

export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.subtype || !body.code) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Build path from parent
    if (body.parent) {
      const parentAccount = await ChartOfAccount.findOne({ code: body.parent });
      if (parentAccount) {
        body.path = `${parentAccount.path}:${body.name}`;
      } else {
        return NextResponse.json({ success: false, error: 'Parent account not found' }, { status: 400 });
      }
    } else {
      // Root account - path is just its name
      body.path = body.name;
    }

    const newAccount = await ChartOfAccount.create(body);

    return NextResponse.json({ success: true, data: newAccount }, { status: 201 });

  } catch (error) {
    if (error.code === 11000) { // Handle duplicate key error for 'code'
      return NextResponse.json({ success: false, error: 'An account with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 
