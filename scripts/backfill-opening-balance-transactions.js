// Backfill opening balance transactions for existing ledgers
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

const transactionSchema = new mongoose.Schema({
  account_path: String,
  debit: Boolean,
  credit: Boolean,
  amount: Number,
  organization: mongoose.Schema.Types.ObjectId,
  meta: Object,
  journal: mongoose.Schema.Types.ObjectId,
  datetime: Date,
}, { strict: false });

const journalSchema = new mongoose.Schema({
  datetime: Date,
  memo: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const LedgerGroup = mongoose.model('LedgerGroup', ledgerGroupSchema, 'ledgergroups');
const Ledger = mongoose.model('Ledger', ledgerSchema, 'ledgers');
const AccountingTransaction = mongoose.model('AccountingTransaction', transactionSchema, 'accountingtransactions');
const Journal = mongoose.model('AccountingJournal', journalSchema, 'accountingjournals');

async function backfill() {
  await mongoose.connect(MONGODB_URI);


  const ledgers = await Ledger.find({ openingBalance: { $ne: 0 } }).lean();
  const allGroups = await LedgerGroup.find({}).lean();

  let count = 0;
  for (const ledger of ledgers) {
    // Build path
    let pathParts = [];
    let currentGroup = allGroups.find(g => g._id.toString() === (ledger.group?.toString()));
    while (currentGroup) {
      pathParts.unshift(currentGroup.name);
      currentGroup = allGroups.find(g => g._id.toString() === (currentGroup.parent ? currentGroup.parent.toString() : null));
    }
    pathParts.push(ledger.name);
    const accountPath = ledger.path || pathParts.join(':');

    // Check if an opening balance transaction already exists
    const existingTxn = await AccountingTransaction.findOne({ account_path: accountPath, organization: ledger.organization, 'meta.openingBalance': true });
    if (existingTxn) continue;

    // Determine if this is an asset/receivable or liability/payable
    const groupDoc = allGroups.find(g => g._id.toString() === ledger.group?.toString());
    let isAssetOrReceivable = false;
    let isLiabilityOrPayable = false;
    if (groupDoc) {
      const groupName = groupDoc.name.toLowerCase();
      if (groupName.includes('asset') || groupName.includes('receivable')) isAssetOrReceivable = true;
      if (groupName.includes('liability') || groupName.includes('payable')) isLiabilityOrPayable = true;
    }
    const debit = !!isAssetOrReceivable;
    const credit = !!isLiabilityOrPayable;
    const txnDebit = debit || (!debit && !credit);
    const txnCredit = credit;

    // Create a minimal journal
    let journalId = undefined;
    try {
      const journal = await Journal.create({ datetime: new Date(), memo: 'Opening Balance (backfill)', organization: ledger.organization });
      journalId = journal._id;
    } catch (e) {}

    await AccountingTransaction.create({
      journal: journalId,
      datetime: new Date(),
      account_path: accountPath,
      debit: txnDebit,
      credit: txnCredit,
      amount: ledger.openingBalance,
      organization: ledger.organization,
      meta: { openingBalance: true, backfill: true }
    });
    count++;

  }


  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
}); 
