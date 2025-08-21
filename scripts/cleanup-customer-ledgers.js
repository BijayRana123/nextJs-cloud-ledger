import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Book } from 'medici';
import Organization from '../lib/models/Organization.js';

async function cleanupCustomerLedgers() {
  try {
    await dbConnect();
    console.log('Connected to database');

    console.log('\n=== CLEANING UP CUSTOMER LEDGER ENTRIES ===');

    // Get the book for medici transactions
    const book = new Book('MyBook');

    // The deleted voucher IDs from zs construction
    const deletedVoucherIds = [
      '689aeb05ff309fbd0e0fda3e', // SV-0001
      '689aed787a590ecde33b9e29', // SV-0002  
      '689aef2b7a590ecde33b9e66'  // SV-0003
    ];

    console.log('Checking for orphaned ledger transactions...');

    // Find all transactions related to the deleted vouchers
    let totalOrphanedTransactions = 0;
    
    for (const voucherId of deletedVoucherIds) {
      console.log(`\nChecking voucher: ${voucherId}`);
      
      // Find transactions with this salesVoucherId in metadata
      const transactions = await book.ledger({
        'meta.salesVoucherId': voucherId
      });

      if (transactions.length > 0) {
        console.log(`❌ Found ${transactions.length} orphaned ledger transactions`);
        
        // Group transactions by account for better visibility
        const accountGroups = {};
        transactions.forEach(tx => {
          const account = tx.account_path.join(':');
          if (!accountGroups[account]) {
            accountGroups[account] = [];
          }
          accountGroups[account].push(tx);
        });

        console.log('  Affected accounts:');
        Object.entries(accountGroups).forEach(([account, txs]) => {
          const totalDebit = txs.reduce((sum, tx) => sum + (tx.debit || 0), 0);
          const totalCredit = txs.reduce((sum, tx) => sum + (tx.credit || 0), 0);
          console.log(`    ${account}: ${txs.length} transactions (Debit: ${totalDebit}, Credit: ${totalCredit})`);
        });

        // Delete the orphaned transactions
        const deleteResult = await mongoose.connection.db.collection('medici_transactions').deleteMany({
          'meta.salesVoucherId': voucherId
        });

        console.log(`  ✅ Deleted ${deleteResult.deletedCount} orphaned ledger transactions`);
        totalOrphanedTransactions += deleteResult.deletedCount;

      } else {
        console.log(`✅ No orphaned ledger transactions found for voucher ${voucherId}`);
      }
    }

    console.log(`\nTotal orphaned ledger transactions removed: ${totalOrphanedTransactions}`);

    // Check for any remaining orphaned transactions
    console.log('\n=== VERIFYING CLEANUP ===');
    
    for (const voucherId of deletedVoucherIds) {
      const remainingTx = await book.ledger({
        'meta.salesVoucherId': voucherId
      });
      
      if (remainingTx.length === 0) {
        console.log(`✅ No remaining transactions for voucher ${voucherId}`);
      } else {
        console.log(`❌ ${remainingTx.length} transactions still exist for voucher ${voucherId}`);
      }
    }

    // Check customer account balances after cleanup
    console.log('\n=== CUSTOMER ACCOUNT BALANCES AFTER CLEANUP ===');
    
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (zsOrg) {
      // Find customer accounts for this organization
      const customerTransactions = await book.ledger({
        account: /^Assets:Accounts Receivable:/,
        'meta.organizationId': zsOrg._id.toString()
      });

      if (customerTransactions.length > 0) {
        // Group by customer account
        const customerBalances = {};
        customerTransactions.forEach(tx => {
          const customerAccount = tx.account_path.join(':');
          if (!customerBalances[customerAccount]) {
            customerBalances[customerAccount] = { debit: 0, credit: 0, balance: 0 };
          }
          customerBalances[customerAccount].debit += tx.debit || 0;
          customerBalances[customerAccount].credit += tx.credit || 0;
          customerBalances[customerAccount].balance = customerBalances[customerAccount].debit - customerBalances[customerAccount].credit;
        });

        console.log('zs construction customer balances:');
        Object.entries(customerBalances).forEach(([account, balance]) => {
          const customerName = account.split(':').pop();
          console.log(`  ${customerName}: Balance ${balance.balance} (Debit: ${balance.debit}, Credit: ${balance.credit})`);
        });
      } else {
        console.log('✅ No customer account transactions found for zs construction');
      }
    }

    // Also check for any journal entries that might be orphaned
    console.log('\n=== CHECKING JOURNAL ENTRIES ===');
    
    const Journal = mongoose.models.Journal || mongoose.model('Journal', new mongoose.Schema({}, { strict: false }));
    
    for (const voucherId of deletedVoucherIds) {
      const orphanedJournals = await Journal.find({
        'meta.salesVoucherId': voucherId
      });

      if (orphanedJournals.length > 0) {
        console.log(`❌ Found ${orphanedJournals.length} orphaned journal entries for voucher ${voucherId}`);
        
        const deleteResult = await Journal.deleteMany({
          'meta.salesVoucherId': voucherId
        });
        
        console.log(`  ✅ Deleted ${deleteResult.deletedCount} orphaned journal entries`);
      } else {
        console.log(`✅ No orphaned journal entries found for voucher ${voucherId}`);
      }
    }

    console.log('\n✅ Customer ledger cleanup completed');

  } catch (error) {
    console.error('Error during customer ledger cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
cleanupCustomerLedgers();