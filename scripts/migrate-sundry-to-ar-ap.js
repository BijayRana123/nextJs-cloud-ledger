// Migrate Sundry Debtors/Creditors to Accounts Receivable/Payable
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not set in environment');
}

const ledgerGroupSchema = new mongoose.Schema({
  name: String,
  parent: mongoose.Schema.Types.ObjectId,
  description: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const ledgerSchema = new mongoose.Schema({
  name: String,
  group: mongoose.Schema.Types.ObjectId,
  description: String,
  openingBalance: Number,
  organization: mongoose.Schema.Types.ObjectId,
  path: String,
}, { strict: false });

const chartOfAccountSchema = new mongoose.Schema({
  name: String,
  path: String,
  code: String,
  type: String,
  subtype: String,
  parent: String,
  isSubledger: Boolean,
  subledgerType: String,
  active: Boolean,
}, { strict: false });

const transactionSchema = new mongoose.Schema({
  account_path: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const LedgerGroup = mongoose.model('LedgerGroup', ledgerGroupSchema, 'ledgergroups');
const Ledger = mongoose.model('Ledger', ledgerSchema, 'ledgers');
const ChartOfAccount = mongoose.model('ChartOfAccount', chartOfAccountSchema, 'chartofaccounts');
const AccountingTransaction = mongoose.model('AccountingTransaction', transactionSchema, 'accountingtransactions');

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Rename Ledger Groups
  const groupRenames = [
    { old: 'Sundry Debtors', new: 'Accounts Receivable' },
    { old: 'Sundry Creditors', new: 'Accounts Payable' },
  ];
  for (const { old, new: newName } of groupRenames) {
    const group = await LedgerGroup.findOne({ name: old });
    if (group) {
      console.log(`Renaming group '${old}' to '${newName}'`);
      group.name = newName;
      await group.save();
      // 2. Update Ledgers in this group
      await Ledger.updateMany({ group: group._id }, { $set: { path: null } }); // force path rebuild
    }
  }

  // 3. Update ledger paths and transaction account_paths
  const allGroups = await LedgerGroup.find({}).lean();
  const ledgers = await Ledger.find({}).lean();
  for (const ledger of ledgers) {
    // Rebuild path
    let pathParts = [];
    let currentGroup = allGroups.find(g => g._id.toString() === (ledger.group?.toString()));
    while (currentGroup) {
      pathParts.unshift(currentGroup.name);
      currentGroup = allGroups.find(g => g._id.toString() === (currentGroup.parent ? currentGroup.parent.toString() : null));
    }
    pathParts.push(ledger.name);
    const newPath = pathParts.join(':');
    if (ledger.path !== newPath) {
      console.log(`Updating ledger path for '${ledger.name}': '${ledger.path}' -> '${newPath}'`);
      await Ledger.updateOne({ _id: ledger._id }, { $set: { path: newPath } });
      // Update transactions
      await AccountingTransaction.updateMany({ account_path: ledger.path }, { $set: { account_path: newPath } });
    }
  }

  // 4. Update ChartOfAccount entries
  for (const { old, new: newName } of groupRenames) {
    // Update name
    await ChartOfAccount.updateMany({ name: old }, { $set: { name: newName } });
    // Update path (manual loop for compatibility)
    const affected = await ChartOfAccount.find({ path: { $regex: old } });
    for (const acc of affected) {
      const newPath = acc.path.replaceAll(old, newName);
      console.log(`Updating ChartOfAccount path: '${acc.path}' -> '${newPath}'`);
      acc.path = newPath;
      await acc.save();
    }
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 