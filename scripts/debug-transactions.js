import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    
    // Check medici_transactions collection
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    console.log(`\n🔍 Checking transactions for organization: ${orgId}`);
    
    // Get all transactions for this organization
    const allTransactions = await transactionCollection.find({
      organizationId: new mongoose.Types.ObjectId(orgId)
    }).toArray();
    
    console.log(`📊 Found ${allTransactions.length} total transactions`);
    
    if (allTransactions.length > 0) {
      console.log('\n📋 Transaction Details:');
      console.log('='.repeat(80));
      
      // Group by account path
      const accountGroups = {};
      
      allTransactions.forEach((txn, index) => {
        const account = txn.accounts || 'Unknown';
        if (!accountGroups[account]) {
          accountGroups[account] = [];
        }
        accountGroups[account].push(txn);
        
        console.log(`${index + 1}. Account: "${account}"`);
        console.log(`   Amount: ${txn.amount}`);
        console.log(`   Debit: ${txn.debit}`);
        console.log(`   Date: ${txn.datetime}`);
        console.log(`   Journal: ${txn._journal}`);
        console.log('');
      });
      
      console.log('\n📊 Summary by Account:');
      console.log('='.repeat(50));
      
      for (const [account, transactions] of Object.entries(accountGroups)) {
        const totalDebit = transactions.filter(t => t.debit).reduce((sum, t) => sum + t.amount, 0);
        const totalCredit = transactions.filter(t => !t.debit).reduce((sum, t) => sum + t.amount, 0);
        const netBalance = totalDebit - totalCredit;
        
        console.log(`Account: "${account}"`);
        console.log(`  Transactions: ${transactions.length}`);
        console.log(`  Total Debits: $${totalDebit.toFixed(2)}`);
        console.log(`  Total Credits: $${totalCredit.toFixed(2)}`);
        console.log(`  Net Balance: $${netBalance.toFixed(2)}`);
        console.log('');
      }
    }
    
    // Check if there are any ChartOfAccount entries for these transaction paths
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;
    
    console.log('\n🔍 Checking ChartOfAccount entries:');
    console.log('='.repeat(50));
    
    const uniqueAccountPaths = [...new Set(allTransactions.map(t => t.accounts))];
    
    for (const accountPath of uniqueAccountPaths) {
      if (!accountPath) continue;
      
      const chartAccount = await ChartOfAccount.findOne({
        path: accountPath,
        organization: new mongoose.Types.ObjectId(orgId)
      });
      
      if (chartAccount) {
        console.log(`✅ "${accountPath}" → Code: ${chartAccount.code}, Type: ${chartAccount.type}`);
      } else {
        console.log(`❌ "${accountPath}" → No ChartOfAccount entry found!`);
      }
    }
    
    // Check what the TrialBalanceService is actually finding
    console.log('\n🔍 Testing TrialBalanceService query:');
    console.log('='.repeat(50));
    
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ code: 1 });
    
    console.log(`Found ${accounts.length} ChartOfAccount entries`);
    
    for (const account of accounts) {
      // Check transactions for this account path
      const txnCount = await transactionCollection.countDocuments({
        accounts: account.path,
        organizationId: new mongoose.Types.ObjectId(orgId)
      });
      
      if (txnCount > 0) {
        console.log(`✅ ${account.code} - ${account.name} (${account.path}) - ${txnCount} transactions`);
        
        // Calculate balance using the same logic as TrialBalanceService
        const transactions = await transactionCollection.find({
          accounts: account.path,
          organizationId: new mongoose.Types.ObjectId(orgId)
        }).toArray();
        
        let debitBalance = 0;
        let creditBalance = 0;
        
        transactions.forEach(txn => {
          if (txn.debit) {
            debitBalance += txn.amount;
          } else {
            creditBalance += txn.amount;
          }
        });
        
        let netBalance = 0;
        let isDebitBalance = false;
        
        if (['asset', 'expense'].includes(account.type)) {
          netBalance = debitBalance - creditBalance;
          isDebitBalance = netBalance > 0;
        } else {
          netBalance = creditBalance - debitBalance;
          isDebitBalance = netBalance < 0;
          netBalance = Math.abs(netBalance);
        }
        
        console.log(`   Debit Total: $${debitBalance.toFixed(2)}`);
        console.log(`   Credit Total: $${creditBalance.toFixed(2)}`);
        console.log(`   Net Balance: $${netBalance.toFixed(2)} (${isDebitBalance ? 'Debit' : 'Credit'})`);
        
        if (netBalance > 0) {
          console.log(`   ✅ Should appear in trial balance`);
        } else {
          console.log(`   ⚠️  Zero balance - won't appear in trial balance`);
        }
      } else {
        console.log(`⚪ ${account.code} - ${account.name} (${account.path}) - No transactions`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugTransactions();