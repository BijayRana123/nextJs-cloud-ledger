import mongoose from 'mongoose';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';
import dbConnect from '../lib/dbConnect.js';

async function testLedgerWithTransactions() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');
    
    // Get the first organization ID from the database
    const db = mongoose.connection.db;
    const organizationsCollection = db.collection('organizations');
    const organization = await organizationsCollection.findOne({});
    
    if (!organization) {
      console.log('❌ No organization found');
      return;
    }
    
    console.log(`\n🏢 Testing with organization: ${organization.name} (${organization._id})`);
    
    // Find accounts that have transactions
    const transactionCollection = db.collection('medici_transactions');
    const accountsWithTransactions = await transactionCollection.distinct('accounts', {
      organizationId: new mongoose.Types.ObjectId(organization._id),
      voided: false
    });
    
    console.log(`\n📊 Found ${accountsWithTransactions.length} account paths with transactions:`);
    accountsWithTransactions.slice(0, 5).forEach(path => {
      console.log(`   - ${path}`);
    });
    
    // Find a ChartOfAccount that matches one of these paths
    for (const accountPath of accountsWithTransactions.slice(0, 10)) {
      const account = await ChartOfAccount.findOne({
        organization: organization._id,
        path: accountPath,
        active: true
      });
      
      if (account) {
        console.log(`\n🎯 Found matching account: ${account.code} - ${account.name}`);
        console.log(`   Path: ${account.path}`);
        console.log(`   ID: ${account._id}`);
        
        // Test the transactions query
        const query = {
          accounts: account.path,
          voided: false,
          organizationId: new mongoose.Types.ObjectId(organization._id)
        };
        
        const transactions = await transactionCollection.find(query).limit(3).toArray();
        console.log(`\n💰 Found ${transactions.length} transactions:`);
        
        transactions.forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.datetime?.toISOString().split('T')[0]} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount} - ${tx.memo || 'No memo'}`);
        });
        
        console.log(`\n🔗 Ledger URL would be: http://localhost:3000/dashboard/accounting/ledger/${account._id}`);
        break;
      } else {
        console.log(`\n❌ No ChartOfAccount found for path: ${accountPath}`);
      }
    }
    
    // Also check what ChartOfAccount paths exist
    console.log(`\n📋 Sample ChartOfAccount paths:`);
    const chartAccounts = await ChartOfAccount.find({
      organization: organization._id,
      active: true
    }).limit(10);
    
    chartAccounts.forEach(acc => {
      console.log(`   - ${acc.code}: ${acc.name} (${acc.path})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLedgerWithTransactions();