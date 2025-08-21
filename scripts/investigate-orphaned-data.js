import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2, Customer, Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function investigateOrphanedData() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get the IDs of deleted vouchers (we know some were deleted)
    const deletedVoucherIds = [
      '689aef2b7a590ecde33b9e5a', // zs construction
      '689aed787a590ecde33b9e1c', // zs construction  
      '689aeb04ff309fbd0e0fda32'  // zs construction
    ];

    console.log('\n=== INVESTIGATING ORPHANED DATA ===');
    console.log('Checking for data related to deleted vouchers:', deletedVoucherIds);

    // Check for journal entries related to deleted vouchers
    const journalModel = mongoose.models.Medici_Journal || 
      mongoose.model('Medici_Journal', new mongoose.Schema({}, { strict: false }));

    console.log('\n=== CHECKING JOURNAL ENTRIES ===');
    for (const voucherId of deletedVoucherIds) {
      const journalEntries = await journalModel.find({
        memo: { $regex: voucherId, $options: 'i' }
      });
      
      if (journalEntries.length > 0) {
        console.log(`❌ Found ${journalEntries.length} journal entries for deleted voucher ${voucherId}`);
        journalEntries.forEach((entry, index) => {
          console.log(`  ${index + 1}. Journal ID: ${entry._id} - Memo: ${entry.memo}`);
        });
      } else {
        console.log(`✅ No journal entries found for voucher ${voucherId}`);
      }
    }

    // Check for transaction entries
    const transactionModel = mongoose.models.Medici_Transaction || 
      mongoose.model('Medici_Transaction', new mongoose.Schema({}, { strict: false }));

    console.log('\n=== CHECKING TRANSACTION ENTRIES ===');
    for (const voucherId of deletedVoucherIds) {
      const transactions = await transactionModel.find({
        memo: { $regex: voucherId, $options: 'i' }
      });
      
      if (transactions.length > 0) {
        console.log(`❌ Found ${transactions.length} transactions for deleted voucher ${voucherId}`);
        transactions.forEach((txn, index) => {
          console.log(`  ${index + 1}. Transaction ID: ${txn._id} - Account: ${txn.account_path.join(':')} - Amount: ${txn.credit || txn.debit}`);
        });
      } else {
        console.log(`✅ No transactions found for voucher ${voucherId}`);
      }
    }

    // Check recent inventory changes that might be related
    console.log('\n=== CHECKING RECENT INVENTORY CHANGES ===');
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (zsOrg) {
      const recentItems = await Item.find({
        organization: zsOrg._id,
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).select('name quantity updatedAt');

      console.log(`Found ${recentItems.length} recently updated items for zs construction:`);
      recentItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} - Quantity: ${item.quantity} - Updated: ${item.updatedAt}`);
      });
    }

    // Check for any sales vouchers that might have been created but failed
    console.log('\n=== CHECKING FOR RECENT FAILED VOUCHERS ===');
    const recentFailedVouchers = await SalesVoucher2.find({
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Last 2 hours
      $or: [
        { salesVoucherNumber: { $exists: false } },
        { salesVoucherNumber: null },
        { salesVoucherNumber: '' }
      ]
    }).select('_id organization totalAmount items createdAt');

    if (recentFailedVouchers.length > 0) {
      console.log(`❌ Found ${recentFailedVouchers.length} recent failed vouchers:`);
      for (const voucher of recentFailedVouchers) {
        const org = await Organization.findById(voucher.organization).select('name');
        console.log(`  ID: ${voucher._id} - Org: ${org?.name} - Amount: ${voucher.totalAmount} - Items: ${voucher.items?.length || 0} - Created: ${voucher.createdAt}`);
      }
    } else {
      console.log('✅ No recent failed vouchers found');
    }

    // Check for any journal entries with recent timestamps that might be orphaned
    console.log('\n=== CHECKING FOR RECENT ORPHANED JOURNAL ENTRIES ===');
    const recentJournalEntries = await journalModel.find({
      datetime: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Last 2 hours
      memo: { $regex: /sales.*voucher/i }
    }).select('_id memo datetime voucherNumber');

    if (recentJournalEntries.length > 0) {
      console.log(`Found ${recentJournalEntries.length} recent sales voucher journal entries:`);
      for (const entry of recentJournalEntries) {
        console.log(`  Journal ID: ${entry._id} - Voucher: ${entry.voucherNumber} - Memo: ${entry.memo} - Time: ${entry.datetime}`);
        
        // Check if corresponding sales voucher exists
        const voucherExists = await SalesVoucher2.findById(entry._id);
        if (!voucherExists) {
          console.log(`    ❌ ORPHANED: No sales voucher found for this journal entry`);
        } else {
          console.log(`    ✅ Sales voucher exists`);
        }
      }
    } else {
      console.log('✅ No recent sales voucher journal entries found');
    }

  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the investigation
investigateOrphanedData();