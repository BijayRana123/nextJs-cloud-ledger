// scripts/backfill-sales-voucher-numbers.js

import mongoose from 'mongoose';
import { SalesVoucher } from '../lib/models.js';
import AccountingJournal from '../lib/models/AccountingJournal.js';

// TODO: Update this to your actual connection string or use your .env config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/YOUR_DB_NAME';

async function main() {
  await mongoose.connect(MONGODB_URI);

  const vouchers = await SalesVoucher.find({
    $or: [
      { salesVoucherNumber: { $exists: false } },
      { salesVoucherNumber: null },
      { salesVoucherNumber: '' }
    ]
  });

  console.log(`Found ${vouchers.length} sales vouchers missing voucher number.`);

  for (const voucher of vouchers) {
    // Try to find the corresponding journal by meta.salesVoucherId first
    let journal = await AccountingJournal.findOne({
      'meta.salesVoucherId': voucher._id
    });

    // If not found, try to match by organizationId, date, and amount
    if (!journal) {
      journal = await AccountingJournal.findOne({
        organizationId: voucher.organization,
        datetime: { $gte: new Date(voucher.date), $lt: new Date(new Date(voucher.date).getTime() + 24*60*60*1000) },
        voucherNumber: { $regex: /^SV-/ },
        memo: { $regex: String(voucher.customer), $options: 'i' }
      });
    }

    if (journal && journal.voucherNumber) {
      voucher.salesVoucherNumber = journal.voucherNumber;
      await voucher.save();
      console.log(`Updated voucher ${voucher._id} with number ${journal.voucherNumber}`);
    } else {
      console.warn(`No journal found for sales voucher ${voucher._id}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});