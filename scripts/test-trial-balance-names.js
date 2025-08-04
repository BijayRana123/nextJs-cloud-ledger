import mongoose from 'mongoose';
import TrialBalanceService from '../lib/services/TrialBalanceService.js';
import dbConnect from '../lib/dbConnect.js';

async function testTrialBalanceNames() {
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
    
    // Generate trial balance
    const trialBalanceData = await TrialBalanceService.generateTrialBalance(
      organization._id.toString(),
      new Date()
    );
    
    console.log(`\n📊 Trial Balance Generated:`);
    console.log(`   Total Accounts: ${trialBalanceData.accounts.length}`);
    console.log(`   Total Debits: ${trialBalanceData.totals.totalDebits}`);
    console.log(`   Total Credits: ${trialBalanceData.totals.totalCredits}`);
    console.log(`   Is Balanced: ${trialBalanceData.totals.isBalanced}`);
    
    console.log(`\n📋 Account Names (first 10):`);
    trialBalanceData.accounts.slice(0, 10).forEach((account, index) => {
      const hasObjectIdName = /^[0-9a-f]{24}$/.test(account.accountName);
      const status = hasObjectIdName ? '❌' : '✅';
      console.log(`   ${status} ${account.accountCode}: ${account.accountName} (${account.accountType})`);
      if (account.accountId) {
        console.log(`      ID: ${account.accountId}`);
      }
    });
    
    // Check if any accounts still have ObjectId names
    const accountsWithObjectIdNames = trialBalanceData.accounts.filter(account => 
      /^[0-9a-f]{24}$/.test(account.accountName)
    );
    
    if (accountsWithObjectIdNames.length > 0) {
      console.log(`\n❌ Found ${accountsWithObjectIdNames.length} accounts with ObjectId names:`);
      accountsWithObjectIdNames.forEach(account => {
        console.log(`   - ${account.accountCode}: ${account.accountName}`);
      });
    } else {
      console.log(`\n✅ All accounts have proper names!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testTrialBalanceNames();