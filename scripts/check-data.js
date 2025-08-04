import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    // Check Chart of Accounts
    const accounts = await ChartOfAccount.find({ organization: orgId }).limit(10);
    console.log(`\n📊 Chart of Accounts found: ${accounts.length}`);
    accounts.forEach(acc => console.log(`- ${acc.code}: ${acc.name} (${acc.type}) - Path: ${acc.path}`));

    // Check transactions
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    const transactionCount = await transactionCollection.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(orgId) 
    });
    console.log(`\n💰 Total transactions found: ${transactionCount}`);

    if (transactionCount > 0) {
      const sampleTransactions = await transactionCollection.find({ 
        organizationId: new mongoose.Types.ObjectId(orgId) 
      }).limit(5).toArray();
      console.log('\n📝 Sample transactions:');
      sampleTransactions.forEach(txn => {
        console.log(`- Account: ${txn.accounts}, ${txn.debit ? 'DR' : 'CR'} ${txn.amount}, Date: ${txn.datetime}`);
      });
    }

    // Check all collections that might have transactions
    const collections = ['medici_transactions', 'accountingtransactions', 'transactions'];
    for (const collName of collections) {
      try {
        const coll = db.collection(collName);
        const count = await coll.countDocuments();
        console.log(`\n📋 Collection '${collName}': ${count} documents`);
        if (count > 0) {
          const sample = await coll.findOne();
          console.log(`Sample document keys: ${Object.keys(sample).join(', ')}`);
        }
      } catch (err) {
        console.log(`Collection '${collName}' not found or error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkData();