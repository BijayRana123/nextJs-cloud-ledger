import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ReceiptVoucher from '../lib/models/ReceiptVoucher.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

dotenv.config({ path: '.env.local' });
async function checkReceiptVouchers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Check for duplicate receipt voucher numbers
    console.log('\n=== CHECKING FOR DUPLICATE RECEIPT VOUCHER NUMBERS ===');
    const duplicates = await ReceiptVoucher.aggregate([
      {
        $group: {
          _id: { receiptVoucherNumber: "$receiptVoucherNumber", organization: "$organization" },
          count: { $sum: 1 },
          docs: { $push: { _id: "$_id", date: "$date" } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length > 0) {
      console.log('Found duplicate receipt voucher numbers:');
      for (const dup of duplicates) {
        const org = await Organization.findById(dup._id.organization);
        console.log(`- ${dup._id.receiptVoucherNumber} (Org: ${org?.name || 'Unknown'}) - ${dup.count} duplicates`);
        console.log(`  Document IDs: ${dup.docs.map(d => d._id).join(', ')}`);
      }
    } else {
      console.log('No duplicate receipt voucher numbers found.');
    }

    // Check receipt voucher counters
    console.log('\n=== RECEIPT VOUCHER COUNTERS ===');
    const receiptCounters = await Counter.find({ name: 'receipt_voucher' }).sort({ organization: 1 });
    
    if (receiptCounters.length === 0) {
      console.log('No receipt voucher counters found.');
    } else {
      for (const counter of receiptCounters) {
        // Try to find organization by ID first, then by name
        let org = await Organization.findById(counter.organization);
        if (!org) {
          org = await Organization.findOne({ name: counter.organization });
        }
        console.log(`Counter: ${counter.name} (Org: ${org?.name || 'Unknown'} - ${counter.organization}) - Value: ${counter.value} - Next: RcV-${(counter.value + 1).toString().padStart(5, '0')}`);
      }
    }

    // Check recent receipt vouchers
    console.log('\n=== RECENT RECEIPT VOUCHERS ===');
    const recentVouchers = await ReceiptVoucher.find()
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    if (recentVouchers.length === 0) {
      console.log('No receipt vouchers found.');
    } else {
      for (const voucher of recentVouchers) {
        console.log(`${voucher.receiptVoucherNumber} - Org: ${voucher.organization?.name || 'Unknown'} - Amount: ${voucher.amount} - Date: ${voucher.date?.toISOString()}`);
      }
    }

    // Check for the specific voucher number mentioned in the error
    console.log('\n=== CHECKING SPECIFIC VOUCHER: RcV-00003 ===');
    const specificVoucher = await ReceiptVoucher.find({ receiptVoucherNumber: 'RcV-00003' })
      .populate('organization', 'name');
    
    if (specificVoucher.length > 0) {
      console.log(`Found ${specificVoucher.length} voucher(s) with number RcV-00003:`);
      for (const voucher of specificVoucher) {
        console.log(`- ID: ${voucher._id}, Org: ${voucher.organization?.name || 'Unknown'} (${voucher.organization?._id}), Amount: ${voucher.amount}, Date: ${voucher.date?.toISOString()}`);
      }
    } else {
      console.log('No vouchers found with number RcV-00003.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkReceiptVouchers();