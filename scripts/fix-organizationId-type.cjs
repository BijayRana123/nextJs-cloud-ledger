const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Fix medici_transactions
  const txResult = await db.collection('medici_transactions').updateMany(
    { organizationId: { $type: 'string' } },
    [
      { $set: { organizationId: { $toObjectId: "$organizationId" } } }
    ]
  );
  console.log(`medici_transactions: Converted organizationId to ObjectId in ${txResult.modifiedCount} documents.`);

  // Fix medici_journals
  const journalResult = await db.collection('medici_journals').updateMany(
    { organizationId: { $type: 'string' } },
    [
      { $set: { organizationId: { $toObjectId: "$organizationId" } } }
    ]
  );
  console.log(`medici_journals: Converted organizationId to ObjectId in ${journalResult.modifiedCount} documents.`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
}); 