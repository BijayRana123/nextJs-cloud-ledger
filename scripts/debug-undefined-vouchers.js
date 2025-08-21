import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

async function debugUndefinedVouchers() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find vouchers with undefined/null voucher numbers
    const undefinedVouchers = await SalesVoucher2.find({
      $or: [
        { salesVoucherNumber: { $exists: false } },
        { salesVoucherNumber: null },
        { salesVoucherNumber: '' }
      ]
    }).select('_id organization createdAt totalAmount').sort({ createdAt: -1 }).limit(10);

    console.log('\n=== VOUCHERS WITH UNDEFINED VOUCHER NUMBERS ===');
    for (const voucher of undefinedVouchers) {
      const org = await Organization.findById(voucher.organization).select('name');
      console.log(`ID: ${voucher._id} - Org: ${org?.name || 'Unknown'} (${voucher.organization}) - Amount: ${voucher.totalAmount} - Created: ${voucher.createdAt}`);
    }

    // Check if these are the ones causing the issue
    if (undefinedVouchers.length > 0) {
      console.log('\n=== ANALYZING RECENT UNDEFINED VOUCHERS ===');
      
      // Group by organization
      const orgGroups = {};
      undefinedVouchers.forEach(voucher => {
        const orgId = voucher.organization.toString();
        if (!orgGroups[orgId]) {
          orgGroups[orgId] = [];
        }
        orgGroups[orgId].push(voucher);
      });

      for (const [orgId, vouchers] of Object.entries(orgGroups)) {
        const org = await Organization.findById(orgId).select('name');
        console.log(`\nOrg: ${org?.name || 'Unknown'} (${orgId}) has ${vouchers.length} undefined vouchers`);
        
        // Check counter for this org
        const counter = await Counter.findOne({
          name: 'sales_voucher',
          organization: orgId
        });

        if (counter) {
          console.log(`  Counter value: ${counter.value}`);
        } else {
          console.log(`  ❌ NO COUNTER for this organization`);
        }

        // Check what the next voucher number should be
        const existingVouchers = await SalesVoucher2.find({
          organization: orgId,
          salesVoucherNumber: { $exists: true, $ne: null, $regex: /^SV-\d+$/ }
        }).select('salesVoucherNumber');

        let highestNum = 0;
        existingVouchers.forEach(v => {
          const numPart = parseInt(v.salesVoucherNumber.replace('SV-', ''));
          if (!isNaN(numPart) && numPart > highestNum) {
            highestNum = numPart;
          }
        });

        console.log(`  Highest existing voucher: ${highestNum}`);
        console.log(`  Next voucher should be: SV-${(highestNum + 1).toString().padStart(4, '0')}`);
      }
    }

    // Check for any vouchers created in the last few minutes
    const veryRecentVouchers = await SalesVoucher2.find({
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).select('salesVoucherNumber organization createdAt').sort({ createdAt: -1 });

    console.log('\n=== VERY RECENT VOUCHERS (Last 5 Minutes) ===');
    for (const voucher of veryRecentVouchers) {
      const org = await Organization.findById(voucher.organization).select('name');
      console.log(`${voucher.salesVoucherNumber || 'UNDEFINED'} - Org: ${org?.name || 'Unknown'} - ${voucher.createdAt}`);
    }

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the debug
debugUndefinedVouchers();