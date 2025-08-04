import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugAccountCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    // Check all accounts for the organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ code: 1 });
    
    console.log(`\n📊 Found ${accounts.length} accounts for organization`);
    console.log('\n🔍 Account Code Analysis:');
    console.log('='.repeat(80));
    
    accounts.forEach((acc, index) => {
      console.log(`${index + 1}. Code: "${acc.code}" | Name: "${acc.name}" | Type: ${acc.type}`);
      console.log(`   Path: "${acc.path}"`);
      
      // Check if code looks like a name instead of a code
      if (acc.code && (acc.code.includes(' ') || acc.code.includes(':') || acc.code.length > 10)) {
        console.log(`   ⚠️  WARNING: Code looks like a name instead of numeric code!`);
      }
      
      console.log('');
    });

    // Check for duplicate codes
    const codeCount = {};
    accounts.forEach(acc => {
      if (codeCount[acc.code]) {
        codeCount[acc.code]++;
      } else {
        codeCount[acc.code] = 1;
      }
    });

    console.log('\n🔍 Duplicate Code Analysis:');
    console.log('='.repeat(40));
    Object.keys(codeCount).forEach(code => {
      if (codeCount[code] > 1) {
        console.log(`❌ Code "${code}" appears ${codeCount[code]} times`);
      }
    });

    // Check accounts that have transactions
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const accountsWithTxns = [
      'Assets:Current Assets',
      'Assets:Current Assets:Cash and Bank',
      'Assets:Current Assets:Accounts Receivable',
      'Liabilities:Current Liabilities:Accounts Payable',
      'Equity:Owner\'s Drawings',
      'Expenses:Salaries and Wages'
    ];
    
    console.log('\n💰 Accounts with Transactions:');
    console.log('='.repeat(50));
    
    for (const accountPath of accountsWithTxns) {
      const account = await ChartOfAccount.findOne({
        path: accountPath,
        organization: new mongoose.Types.ObjectId(orgId)
      });
      
      if (account) {
        console.log(`Path: "${accountPath}"`);
        console.log(`Code: "${account.code}" | Name: "${account.name}"`);
        
        const txnCount = await transactionCollection.countDocuments({
          accounts: accountPath,
          organizationId: new mongoose.Types.ObjectId(orgId)
        });
        console.log(`Transactions: ${txnCount}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugAccountCodes();