import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function cleanupNullVoucherNumbers() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find all vouchers with null/undefined voucher numbers
    const nullVouchers = await SalesVoucher2.find({
      $or: [
        { salesVoucherNumber: { $exists: false } },
        { salesVoucherNumber: null },
        { salesVoucherNumber: '' }
      ]
    }).select('_id organization createdAt totalAmount').sort({ createdAt: -1 });

    console.log(`\nFound ${nullVouchers.length} vouchers with null/undefined voucher numbers`);

    if (nullVouchers.length > 0) {
      // Group by organization
      const orgGroups = {};
      for (const voucher of nullVouchers) {
        const orgId = voucher.organization.toString();
        if (!orgGroups[orgId]) {
          orgGroups[orgId] = [];
        }
        orgGroups[orgId].push(voucher);
      }

      console.log('\n=== VOUCHERS BY ORGANIZATION ===');
      for (const [orgId, vouchers] of Object.entries(orgGroups)) {
        const org = await Organization.findById(orgId).select('name');
        console.log(`\nOrg: ${org?.name || 'Unknown'} (${orgId}) - ${vouchers.length} vouchers`);
        
        vouchers.forEach((voucher, index) => {
          console.log(`  ${index + 1}. ID: ${voucher._id} - Amount: ${voucher.totalAmount} - Created: ${voucher.createdAt}`);
        });

        // Ask if we should delete these (for now, let's just report)
        console.log(`  These vouchers appear to be failed creations and should be cleaned up.`);
      }

      // For safety, let's only delete very recent ones (last 24 hours) that are likely failed attempts
      const recentFailedVouchers = await SalesVoucher2.find({
        $or: [
          { salesVoucherNumber: { $exists: false } },
          { salesVoucherNumber: null },
          { salesVoucherNumber: '' }
        ],
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      console.log(`\n=== CLEANING UP RECENT FAILED VOUCHERS ===`);
      console.log(`Found ${recentFailedVouchers.length} recent failed vouchers (last 24 hours)`);

      if (recentFailedVouchers.length > 0) {
        const deleteResult = await SalesVoucher2.deleteMany({
          $or: [
            { salesVoucherNumber: { $exists: false } },
            { salesVoucherNumber: null },
            { salesVoucherNumber: '' }
          ],
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        console.log(`✅ Deleted ${deleteResult.deletedCount} recent failed vouchers`);
      }

      // Check remaining null vouchers
      const remainingNullVouchers = await SalesVoucher2.countDocuments({
        $or: [
          { salesVoucherNumber: { $exists: false } },
          { salesVoucherNumber: null },
          { salesVoucherNumber: '' }
        ]
      });

      console.log(`\nRemaining vouchers with null numbers: ${remainingNullVouchers}`);
      if (remainingNullVouchers > 0) {
        console.log('ℹ️  These are older vouchers that may need manual review before deletion');
      }
    }

    console.log('\n✅ Cleanup completed');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
cleanupNullVoucherNumbers();