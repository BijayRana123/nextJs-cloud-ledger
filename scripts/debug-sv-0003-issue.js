import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

async function debugSV0003Issue() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find all vouchers with SV-0003
    const sv0003Vouchers = await SalesVoucher2.find({
      salesVoucherNumber: 'SV-0003'
    }).select('salesVoucherNumber organization createdAt');

    console.log('\n=== VOUCHERS WITH SV-0003 ===');
    for (const voucher of sv0003Vouchers) {
      const org = await Organization.findById(voucher.organization).select('name');
      console.log(`SV-0003 exists in org: ${org?.name || 'Unknown'} (${voucher.organization}) - Created: ${voucher.createdAt}`);
    }

    // Check all sales vouchers for each organization that has SV-0003
    for (const voucher of sv0003Vouchers) {
      const orgId = voucher.organization.toString();
      const org = await Organization.findById(orgId).select('name');
      
      console.log(`\n=== CHECKING ORG: ${org?.name || 'Unknown'} (${orgId}) ===`);
      
      // Get all vouchers for this org
      const allVouchers = await SalesVoucher2.find({
        organization: orgId,
        salesVoucherNumber: { $exists: true, $ne: null, $regex: /^SV-\d+$/ }
      }).select('salesVoucherNumber createdAt').sort({ createdAt: 1 });

      console.log(`Found ${allVouchers.length} vouchers:`);
      allVouchers.forEach((v, index) => {
        console.log(`  ${index + 1}. ${v.salesVoucherNumber} - ${v.createdAt}`);
      });

      // Find highest number
      let highestNum = 0;
      allVouchers.forEach(v => {
        const numPart = parseInt(v.salesVoucherNumber.replace('SV-', ''));
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      });

      console.log(`Highest voucher number: ${highestNum}`);

      // Check counter for this org
      const counter = await Counter.findOne({
        name: 'sales_voucher',
        organization: orgId
      });

      if (counter) {
        console.log(`Counter value: ${counter.value} (Next would be: SV-${counter.value.toString().padStart(4, '0')})`);
        if (counter.value <= highestNum) {
          console.log(`❌ PROBLEM: Counter (${counter.value}) is not higher than highest voucher (${highestNum})`);
        } else {
          console.log(`✅ Counter looks correct`);
        }
      } else {
        console.log(`❌ NO COUNTER FOUND for this organization`);
      }
    }

    // Check if there are any recent vouchers that might have been created after our fix
    const recentVouchers = await SalesVoucher2.find({
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }).select('salesVoucherNumber organization createdAt').sort({ createdAt: -1 });

    console.log('\n=== RECENT VOUCHERS (Last Hour) ===');
    for (const voucher of recentVouchers) {
      const org = await Organization.findById(voucher.organization).select('name');
      console.log(`${voucher.salesVoucherNumber} - Org: ${org?.name || 'Unknown'} - ${voucher.createdAt}`);
    }

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the debug
debugSV0003Issue();