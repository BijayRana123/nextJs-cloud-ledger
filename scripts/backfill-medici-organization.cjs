// scripts/backfill-medici-organization.cjs
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function main() {
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const journals = db.collection('medici_journals');
  const transactions = db.collection('medici_transactions');

  // Helper: Find organizationId from linked voucher
  async function findOrganizationIdFromMeta(meta) {
    if (!meta) return null;
    // Try all possible voucher types
    const voucherLookups = [
      { key: 'paymentVoucherId', collection: 'paymentvouchers' },
      { key: 'receiptVoucherId', collection: 'receiptvouchers' },
      { key: 'salesVoucherId', collection: 'salesvouchers' },
      { key: 'purchaseOrderId', collection: 'purchaseorders' },
      { key: 'journalVoucherId', collection: 'journalvouchers' },
      { key: 'contraVoucherId', collection: 'contravouchers' },
      { key: 'salesReturnId', collection: 'salesreturnvouchers' },
      { key: 'purchaseReturnId', collection: 'purchasereturnvouchers' },
      // Add more as needed
    ];
    for (const { key, collection } of voucherLookups) {
      if (meta[key]) {
        const doc = await db.collection(collection).findOne({ _id: ObjectId(meta[key]) });
        if (doc && doc.organization) return doc.organization;
      }
    }
    return null;
  }

  // 1. Update medici_journals
  const allJournals = await journals.find({ organization: { $exists: false } }).toArray();
  for (const journal of allJournals) {
    // Try to get organization from first transaction
    const firstTxn = await transactions.findOne({ _journal: journal._id });
    let orgId = null;
    if (firstTxn && firstTxn.meta) {
      orgId = await findOrganizationIdFromMeta(firstTxn.meta);
    }
    // Fallback: try meta on journal
    if (!orgId && journal.meta) {
      orgId = await findOrganizationIdFromMeta(journal.meta);
    }
    if (orgId) {
      await journals.updateOne({ _id: journal._id }, { $set: { organizationId: orgId } });
      console.log(`Updated journal ${journal._id} with organization ${orgId}`);
    }
  }

  // 2. Update medici_transactions
  const allTxns = await transactions.find({ organization: { $exists: false } }).toArray();
  for (const txn of allTxns) {
    let orgId = null;
    if (txn.meta) {
      orgId = await findOrganizationIdFromMeta(txn.meta);
    }
    // Fallback: try to get from parent journal
    if (!orgId && txn._journal) {
      const journal = await journals.findOne({ _id: txn._journal });
      if (journal && journal.organization) orgId = journal.organization;
    }
    if (orgId) {
      await transactions.updateOne({ _id: txn._id }, { $set: { organizationId: orgId } });
      console.log(`Updated transaction ${txn._id} with organization ${orgId}`);
    }
  }

  console.log('Backfill complete!');
  process.exit(0);
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});