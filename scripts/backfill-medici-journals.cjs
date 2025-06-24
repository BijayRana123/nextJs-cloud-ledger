// scripts/backfill-medici-journals.cjs

const mongoose = require('mongoose');

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function main() {
  await mongoose.connect(mongoConnectionString);

  const PaymentVoucher = mongoose.models.PaymentVoucher || mongoose.model('PaymentVoucher', new mongoose.Schema({
    paymentVoucherNumber: String,
    date: Date,
    supplier: mongoose.Schema.Types.Mixed,
    amount: Number,
    journalId: mongoose.Schema.Types.ObjectId
  }, { collection: 'paymentvouchers' }));

  const MediciJournal = mongoose.models.Medici_Journal || mongoose.model('Medici_Journal', new mongoose.Schema({
    voucherNumber: String,
    memo: String,
    datetime: Date
  }, { collection: 'medici_journals' }));

  const vouchers = await PaymentVoucher.find({ paymentVoucherNumber: { $exists: true } });
  let updatedJournals = 0;
  let updatedVouchers = 0;

  for (const voucher of vouchers) {
    // Try to find a journal by close datetime and supplier ID in memo
    let supplierId = '';
    if (voucher.supplier && typeof voucher.supplier === 'object') {
      if (voucher.supplier._id) {
        supplierId = voucher.supplier._id.toString();
      } else if (voucher.supplier.$oid) {
        supplierId = voucher.supplier.$oid;
      } else {
        supplierId = voucher.supplier.toString();
      }
    } else if (voucher.supplier) {
      supplierId = voucher.supplier.toString();
    }
    console.log(`Trying to match voucher ${voucher.paymentVoucherNumber} (supplier: ${supplierId}, date: ${voucher.date})`);
    const journal = await MediciJournal.findOne({
      memo: { $regex: supplierId, $options: 'i' },
      datetime: { $gte: new Date(voucher.date.getTime() - 60000), $lte: new Date(voucher.date.getTime() + 60000) }
    });
    if (journal) {
      console.log(`Voucher ${voucher.paymentVoucherNumber} matched to journal ${journal._id} (memo: ${journal.memo})`);
      if (!journal.voucherNumber) {
        journal.voucherNumber = voucher.paymentVoucherNumber;
        await journal.save();
        updatedJournals++;
      }
      if (!voucher.journalId) {
        voucher.journalId = journal._id;
        await voucher.save();
        updatedVouchers++;
      }
    } else {
      console.log(`No journal found for voucher ${voucher.paymentVoucherNumber} (supplier: ${supplierId}, date: ${voucher.date})`);
    }
  }

  console.log(`Backfilled ${updatedJournals} medici journals with voucherNumber.`);
  console.log(`Backfilled ${updatedVouchers} payment vouchers with journalId.`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});