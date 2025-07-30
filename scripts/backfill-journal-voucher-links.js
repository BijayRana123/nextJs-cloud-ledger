// Usage: node scripts/backfill-journal-voucher-links.js
import mongoose from 'mongoose';
import SalesVoucher from '../lib/models/SalesVoucher.js';
import PaymentVoucher from '../lib/models/PaymentVoucher.js';
// Invoice, CreditNote, Payment are not full models, so use raw collection access

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function backfillJournalVoucherLinks() {
  await mongoose.connect(mongoConnectionString);
  const db = mongoose.connection.db;
  const journalCollection = db.collection('medici_journals');
  const invoiceCollection = db.collection('invoices');
  const creditNoteCollection = db.collection('creditnotes');
  const paymentCollection = db.collection('payments');

  const cursor = journalCollection.find({ voucherNumber: { $exists: true, $ne: '' } });
  let updatedCount = 0;
  let notFoundCount = 0;
  let total = 0;
  while (await cursor.hasNext()) {
    const journal = await cursor.next();
    total++;
    const { voucherNumber } = journal;
    let found = false;
    // Try SalesVoucher
    const salesVoucher = await SalesVoucher.findOne({ salesVoucherNumber: voucherNumber });
    if (salesVoucher) {
      await journalCollection.updateOne(
        { _id: journal._id },
        { $set: { 'meta.salesVoucherId': salesVoucher._id } }
      );

      updatedCount++;
      found = true;
      continue;
    }
    // Try PaymentVoucher
    const paymentVoucher = await PaymentVoucher.findOne({ paymentVoucherNumber: voucherNumber });
    if (paymentVoucher) {
      await journalCollection.updateOne(
        { _id: journal._id },
        { $set: { 'meta.paymentVoucherId': paymentVoucher._id } }
      );

      updatedCount++;
      found = true;
      continue;
    }
    // Try Invoice
    const invoice = await invoiceCollection.findOne({ invoiceNumber: voucherNumber });
    if (invoice) {
      await journalCollection.updateOne(
        { _id: journal._id },
        { $set: { 'meta.invoiceId': invoice._id } }
      );

      updatedCount++;
      found = true;
      continue;
    }
    // Try CreditNote
    const creditNote = await creditNoteCollection.findOne({ creditNoteNumber: voucherNumber });
    if (creditNote) {
      await journalCollection.updateOne(
        { _id: journal._id },
        { $set: { 'meta.creditNoteId': creditNote._id } }
      );

      updatedCount++;
      found = true;
      continue;
    }
    // Try Payment
    const payment = await paymentCollection.findOne({ paymentNumber: voucherNumber });
    if (payment) {
      await journalCollection.updateOne(
        { _id: journal._id },
        { $set: { 'meta.paymentId': payment._id } }
      );

      updatedCount++;
      found = true;
      continue;
    }
    if (!found) {
      notFoundCount++;

    }
  }

  await mongoose.disconnect();
}

backfillJournalVoucherLinks().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
}); 
