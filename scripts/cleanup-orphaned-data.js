import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2, Customer, Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function cleanupOrphanedData() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get journal and transaction models
    const journalModel = mongoose.models.Medici_Journal || 
      mongoose.model('Medici_Journal', new mongoose.Schema({}, { strict: false }));
    
    const transactionModel = mongoose.models.Medici_Transaction || 
      mongoose.model('Medici_Transaction', new mongoose.Schema({}, { strict: false }));

    console.log('\n=== CLEANING UP ORPHANED JOURNAL ENTRIES ===');

    // Find orphaned journal entries for zs construction
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (!zsOrg) {
      console.log('❌ zs construction organization not found');
      return;
    }

    // Find journal entries that don't have corresponding sales vouchers
    const recentJournalEntries = await journalModel.find({
      datetime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      memo: { $regex: /sales.*voucher/i },
      organizationId: zsOrg._id
    });

    console.log(`Found ${recentJournalEntries.length} recent journal entries for zs construction`);

    const orphanedJournalIds = [];
    const orphanedVoucherNumbers = [];

    for (const journalEntry of recentJournalEntries) {
      // Check if corresponding sales voucher exists
      const voucherExists = await SalesVoucher2.findById(journalEntry._id);
      if (!voucherExists) {
        console.log(`❌ ORPHANED: Journal ${journalEntry._id} - Voucher: ${journalEntry.voucherNumber} - Memo: ${journalEntry.memo}`);
        orphanedJournalIds.push(journalEntry._id);
        if (journalEntry.voucherNumber) {
          orphanedVoucherNumbers.push(journalEntry.voucherNumber);
        }
      }
    }

    // Delete orphaned journal entries
    if (orphanedJournalIds.length > 0) {
      console.log(`\nDeleting ${orphanedJournalIds.length} orphaned journal entries...`);
      const journalDeleteResult = await journalModel.deleteMany({
        _id: { $in: orphanedJournalIds }
      });
      console.log(`✅ Deleted ${journalDeleteResult.deletedCount} orphaned journal entries`);

      // Delete related transactions
      console.log(`\nDeleting related transactions...`);
      const transactionDeleteResult = await transactionModel.deleteMany({
        _journal: { $in: orphanedJournalIds }
      });
      console.log(`✅ Deleted ${transactionDeleteResult.deletedCount} related transactions`);
    }

    console.log('\n=== FIXING INVENTORY ISSUES ===');

    // Find items with undefined or null quantities
    const corruptedItems = await Item.find({
      organization: zsOrg._id,
      $or: [
        { quantity: { $exists: false } },
        { quantity: null },
        { quantity: undefined },
        { quantity: { $type: "string" } } // Sometimes quantities get stored as strings
      ]
    });

    console.log(`Found ${corruptedItems.length} items with corrupted quantities`);

    for (const item of corruptedItems) {
      console.log(`❌ Item "${item.name}" has corrupted quantity: ${item.quantity}`);
      
      // Reset quantity to 0 (you might want to set this to actual stock levels)
      await Item.updateOne(
        { _id: item._id },
        { quantity: 0 }
      );
      console.log(`✅ Reset "${item.name}" quantity to 0`);
    }

    console.log('\n=== CHECKING FOR OTHER ORPHANED DATA ===');

    // Check for any other recent failed vouchers across all organizations
    const allRecentFailedVouchers = await SalesVoucher2.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      $or: [
        { salesVoucherNumber: { $exists: false } },
        { salesVoucherNumber: null },
        { salesVoucherNumber: '' }
      ]
    }).populate('organization', 'name');

    if (allRecentFailedVouchers.length > 0) {
      console.log(`❌ Found ${allRecentFailedVouchers.length} recent failed vouchers across all organizations:`);
      
      for (const voucher of allRecentFailedVouchers) {
        console.log(`  ID: ${voucher._id} - Org: ${voucher.organization?.name} - Amount: ${voucher.totalAmount} - Created: ${voucher.createdAt}`);
        
        // Check for related journal entries
        const relatedJournal = await journalModel.findById(voucher._id);
        if (relatedJournal) {
          console.log(`    ❌ Has orphaned journal entry: ${relatedJournal.voucherNumber}`);
          
          // Delete the journal entry and its transactions
          await journalModel.deleteOne({ _id: voucher._id });
          await transactionModel.deleteMany({ _journal: voucher._id });
          console.log(`    ✅ Deleted orphaned journal and transactions`);
        }
        
        // Delete the failed voucher
        await SalesVoucher2.deleteOne({ _id: voucher._id });
        console.log(`    ✅ Deleted failed voucher`);
      }
    } else {
      console.log('✅ No other recent failed vouchers found');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Cleaned up orphaned journal entries: ${orphanedJournalIds.length}`);
    console.log(`✅ Fixed corrupted inventory items: ${corruptedItems.length}`);
    console.log(`✅ Cleaned up failed vouchers: ${allRecentFailedVouchers.length}`);
    
    if (orphanedVoucherNumbers.length > 0) {
      console.log(`\n⚠️  The following voucher numbers were used by orphaned entries:`);
      orphanedVoucherNumbers.forEach(num => console.log(`   - ${num}`));
      console.log(`These numbers are now available for reuse.`);
    }

    console.log('\n✅ Cleanup completed successfully');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
cleanupOrphanedData();