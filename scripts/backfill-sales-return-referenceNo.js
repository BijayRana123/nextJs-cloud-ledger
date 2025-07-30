// scripts/backfill-sales-return-referenceNo.js

import mongoose from 'mongoose';
import { SalesReturnVoucher } from '../lib/models.js';

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function main() {
  await mongoose.connect(mongoConnectionString);

  const vouchers = await SalesReturnVoucher.find({ $or: [{ referenceNo: { $exists: false } }, { referenceNo: null }] });

  for (const voucher of vouchers) {
    // Find the corresponding medici_journal by organization and date
    const journal = await mongoose.connection.db.collection('medici_journals').findOne({
      organizationId: voucher.organization,
      memo: { $regex: 'Sales Return' },
      datetime: { $gte: new Date(voucher.date).setHours(0,0,0,0), $lte: new Date(voucher.date).setHours(23,59,59,999) }
    });

    if (journal && journal.voucherNumber) {
      voucher.referenceNo = journal.voucherNumber;
      await voucher.save();

    } else {
      console.warn(`No journal found for voucher ${voucher._id}`);
    }
  }

  await mongoose.disconnect();

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
