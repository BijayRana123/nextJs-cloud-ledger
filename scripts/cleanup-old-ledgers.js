// scripts/cleanup-old-ledgers.js
import 'dotenv/config';
import dbConnect from '../lib/dbConnect.js';
import mongoose from 'mongoose';
import { Ledger, LedgerGroup } from '../lib/models.js';
import AccountingTransaction from '../lib/models/AccountingTransaction.js';



// List of old account paths to remove (as provided by user)
const OLD_PATHS = [
  'Assets:Current Assets:Accounts Receivable',
  'Assets:Current Assets:Accounts Receivable:asdf',
  'Assets:Current Assets:Cash and Bank',
  'Assets:Current Assets:Inventory',
  'Expenses:Cost of Goods Sold',
  'Expenses:Other Expenses:Office Supplies',
  'Expenses:Other Expenses:Tax Expense',
  'Expenses:Rent Expense',
  'Expenses:Salaries and Wages:Michael Brown',
  'Liabilities:Current Liabilities:Accounts Payable:gcgcgcg',
  'Liabilities:Current Liabilities:Employee Deductions',
  'Liabilities:Current Liabilities:Taxes Payable',
  'Revenue:Sales Revenue',
];

// Helper to build the full path for a ledger
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

// Helper to build the full path for a group
function buildGroupPath(group, groups) {
  let pathParts = [group.name];
  let currentGroup = group;
  while (currentGroup.parent) {
    currentGroup = groups.find(g => g._id.toString() === currentGroup.parent.toString());
    if (currentGroup) pathParts.unshift(currentGroup.name);
    else break;
  }
  return pathParts.join(":");
}

async function main() {
  await dbConnect();
  // Remove orgId filtering to operate on all organizations

  // Fetch all groups and ledgers for all orgs
  const allGroups = await LedgerGroup.find({}).lean();
  const allLedgers = await Ledger.find({}).populate('group').lean();

  // 1. Find ledgers to delete
  const ledgersToDelete = allLedgers.filter(ledger => {
    const path = buildLedgerPath(ledger, allGroups);
    return OLD_PATHS.some(oldPath => path === oldPath || path.startsWith(oldPath + ':'));
  });
  const ledgerPathsToDelete = ledgersToDelete.map(l => buildLedgerPath(l, allGroups));

  // 2. Find groups to delete
  const groupsToDelete = allGroups.filter(group => {
    const path = buildGroupPath(group, allGroups);
    return OLD_PATHS.some(oldPath => path === oldPath || path.startsWith(oldPath + ':'));
  });
  const groupPathsToDelete = groupsToDelete.map(g => buildGroupPath(g, allGroups));

  // 3. Delete transactions referencing these ledger paths (across all orgs)
  const txnDeleteResult = await AccountingTransaction.deleteMany({
    account_path: { $in: ledgerPathsToDelete },
  });

  // 4. Delete ledgers
  const ledgerIds = ledgersToDelete.map(l => l._id);
  const ledgerDeleteResult = await Ledger.deleteMany({ _id: { $in: ledgerIds } });

  // 5. Delete groups
  const groupIds = groupsToDelete.map(g => g._id);
  const groupDeleteResult = await LedgerGroup.deleteMany({ _id: { $in: groupIds } });

  // 6. Log results






  process.exit(0);
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
}); 
