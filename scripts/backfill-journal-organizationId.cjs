// scripts/backfill-journal-organizationId.cjs
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const journals = await db.collection('medici_journals').find({ organizationId: { $exists: false } }).toArray();
  console.log(`Found ${journals.length} journals missing organizationId`);
  let updated = 0;

  for (const journal of journals) {
    const journalId = journal._id;
    // Find any transaction for this journal that has organizationId
    const txn = await db.collection('medici_transactions').findOne({ _journal: journalId, organizationId: { $exists: true } });
    if (txn && txn.organizationId) {
      await db.collection('medici_journals').updateOne(
        { _id: journalId },
        { $set: { organizationId: txn.organizationId } }
      );
      console.log(`Updated journal ${journalId} with organizationId ${txn.organizationId}`);
      updated++;
    } else {
      console.log(`No transaction with organizationId found for journal ${journalId}`);
    }
  }

  console.log(`Updated ${updated} journals with organizationId.`);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
});