// Fix transaction account_path for migrated ledgers
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not set in environment');
}

const transactionSchema = new mongoose.Schema({
  account_path: String,
  organization: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const AccountingTransaction = mongoose.model('AccountingTransaction', transactionSchema, 'accountingtransactions');

async function fixPaths() {
  await mongoose.connect(MONGODB_URI);


  // Update Sundry Debtors -> Accounts Receivable
  const debtors = await AccountingTransaction.find({ account_path: { $regex: 'Sundry Debtors' } });
  let debtorsUpdated = 0;
  for (const txn of debtors) {
    txn.account_path = txn.account_path.replace(/Sundry Debtors/g, 'Accounts Receivable');
    await txn.save();
    debtorsUpdated++;
  }


  // Update Sundry Creditors -> Accounts Payable
  const creditors = await AccountingTransaction.find({ account_path: { $regex: 'Sundry Creditors' } });
  let creditorsUpdated = 0;
  for (const txn of creditors) {
    txn.account_path = txn.account_path.replace(/Sundry Creditors/g, 'Accounts Payable');
    await txn.save();
    creditorsUpdated++;
  }


  await mongoose.disconnect();

}

fixPaths().catch(err => {
  console.error('Failed to fix transaction account paths:', err);
  process.exit(1);
});
