// Usage: node scripts/backfill-journal-voucher-numbers.js

import mongoose from 'mongoose';
import Counter from '../lib/models/Counter.js';

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function backfillJournalVoucherNumbers() {
  await mongoose.connect(mongoConnectionString);
  const db = mongoose.connection.db;
  const journalCollection = db.collection('medici_journals');

  // Find all journal entries missing voucherNumber
  const cursor = journalCollection.find({ $or: [ { voucherNumber: { $exists: false } }, { voucherNumber: null }, { voucherNumber: '' } ] });
  let updatedCount = 0;
  while (await cursor.hasNext()) {
    const journal = await cursor.next();
    // Generate the next voucher number using the counter
    const voucherNumber = await Counter.getNextSequence('journal_entry', { prefix: 'JV-', paddingSize: 6 });
    await journalCollection.updateOne(
      { _id: journal._id },
      { $set: { voucherNumber } }
    );
    updatedCount++;
    console.log(`Updated journal ${journal._id} with voucherNumber ${voucherNumber}`);
  }
  console.log(`Backfill complete. Updated ${updatedCount} journal entries.`);
  await mongoose.disconnect();
}

backfillJournalVoucherNumbers().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
}); 