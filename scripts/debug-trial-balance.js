import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugTrialBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    // Check accounts for organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId),
      active: true
    }).sort({ code: 1 });
    
    console.log(`\n📊 Found ${accounts.length} active accounts for organization`);
    accounts.forEach(acc => {
      console.log(`  - ${acc.code}: ${acc.name} (${acc.type}) - Path: "${acc.path}"`);
    });

    // Check transaction paths
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const accountPaths = await transactionCollection.distinct('accounts', {
      organizationId: new mongoose.Types.ObjectId(orgId)
    });
    
    console.log(`\n💰 Transaction account paths (${accountPaths.length}):`);
    accountPaths.forEach(path => console.log(`  - "${path}"`));
    
    // Check for matches
    console.log(`\n🔍 Checking for matches between accounts and transaction paths:`);
    let matchCount = 0;
    
    for (const account of accounts) {
      const hasTransactions = accountPaths.includes(account.path);
      console.log(`  - Account "${account.path}" has transactions: ${hasTransactions}`);
      if (hasTransactions) {
        matchCount++;
        
        // Get sample transactions for this account
        const sampleTxns = await transactionCollection.find({
          accounts: account.path,
          organizationId: new mongoose.Types.ObjectId(orgId)
        }).limit(3).toArray();
        
        console.log(`    Sample transactions (${sampleTxns.length}):`);
        sampleTxns.forEach(txn => {
          console.log(`      - ${txn.debit ? 'DR' : 'CR'} ${txn.amount} on ${txn.datetime.toDateString()}`);
        });
      }
    }
    
    console.log(`\n📈 Summary: ${matchCount} accounts have transactions`);
    
    // Let's also check if there are any case sensitivity issues
    console.log(`\n🔤 Checking for case sensitivity issues:`);
    const lowerAccountPaths = accounts.map(acc => acc.path.toLowerCase());
    const lowerTransactionPaths = accountPaths.map(path => path.toLowerCase());
    
    const caseInsensitiveMatches = lowerAccountPaths.filter(path => 
      lowerTransactionPaths.includes(path)
    );
    
    console.log(`Case-insensitive matches: ${caseInsensitiveMatches.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugTrialBalance();