const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Remove 'book' field from medici_transactions
  const txResult = await db.collection('medici_transactions').updateMany(
    { book: { $exists: true } },
    { $unset: { book: "" } }
  );
  console.log(`medici_transactions: Removed 'book' field from ${txResult.modifiedCount} documents.`);

  // Remove 'book' field from medici_journals
  const journalResult = await db.collection('medici_journals').updateMany(
    { book: { $exists: true } },
    { $unset: { book: "" } }
  );
  console.log(`medici_journals: Removed 'book' field from ${journalResult.modifiedCount} documents.`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
}); 