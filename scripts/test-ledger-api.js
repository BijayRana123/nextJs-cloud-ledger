import mongoose from 'mongoose';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';
import dbConnect from '../lib/dbConnect.js';

async function testLedgerAPI() {
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
    
    // Get a sample account with transactions
    const account = await ChartOfAccount.findOne({
      organization: organization._id,
      active: true
    });
    
    if (!account) {
      console.log('❌ No account found');
      return;
    }
    
    console.log(`\n📊 Testing account: ${account.code} - ${account.name}`);
    console.log(`   Path: ${account.path}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   ID: ${account._id}`);
    
    // Test the transactions query
    const transactionCollection = db.collection('medici_transactions');
    const query = {
      accounts: account.path,
      voided: false,
      organizationId: new mongoose.Types.ObjectId(organization._id)
    };
    
    const transactions = await transactionCollection.find(query).limit(5).toArray();
    console.log(`\n💰 Found ${transactions.length} transactions for this account`);
    
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.datetime?.toISOString().split('T')[0]} - ${tx.debit ? 'DR' : 'CR'} ${tx.amount} - ${tx.memo || 'No memo'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLedgerAPI();