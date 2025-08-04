import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugBalanceCalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    const asOfDate = new Date();
    
    // Get accounts that should have transactions
    const accountsWithTxns = [
      'Assets:Current Assets',
      'Assets:Current Assets:Cash and Bank',
      'Assets:Current Assets:Accounts Receivable',
      'Liabilities:Current Liabilities:Accounts Payable',
      'Equity:Owner\'s Drawings',
      'Expenses:Salaries and Wages'
    ];
    
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    for (const accountPath of accountsWithTxns) {
      console.log(`\n🔍 Analyzing account: "${accountPath}"`);
      
      // Find the account in chart of accounts
      const account = await ChartOfAccount.findOne({
        path: accountPath,
        organization: new mongoose.Types.ObjectId(orgId)
      });
      
      if (!account) {
        console.log(`  ❌ Account not found in Chart of Accounts`);
        continue;
      }
      
      console.log(`  ✅ Account found: ${account.code} - ${account.name} (${account.type})`);
      
      // Build query for transactions
      const query = {
        accounts: account.path,
        voided: false,
        organizationId: new mongoose.Types.ObjectId(orgId),
        datetime: { $lte: asOfDate }
      };
      
      console.log(`  🔍 Query:`, JSON.stringify(query, null, 2));
      
      // Get transactions
      const transactions = await transactionCollection.find(query).toArray();
      console.log(`  📊 Found ${transactions.length} transactions`);
      
      if (transactions.length === 0) {
        console.log(`  ⚠️  No transactions found for this account`);
        continue;
      }
      
      let debitBalance = 0;
      let creditBalance = 0;
      
      console.log(`  📝 Transaction details:`);
      transactions.forEach((txn, index) => {
        console.log(`    ${index + 1}. ${txn.debit ? 'DR' : 'CR'} ${txn.amount} on ${txn.datetime.toDateString()} (voided: ${txn.voided})`);
        
        if (txn.debit) {
          debitBalance += txn.amount;
        } else if (txn.credit) {
          creditBalance += txn.amount;
        }
      });
      
      console.log(`  💰 Total Debits: ${debitBalance}`);
      console.log(`  💰 Total Credits: ${creditBalance}`);
      
      // Calculate net balance based on account type
      let netBalance = 0;
      let isDebitBalance = false;
      
      if (['asset', 'expense'].includes(account.type)) {
        netBalance = debitBalance - creditBalance;
        isDebitBalance = netBalance > 0;
        console.log(`  📈 Asset/Expense account: Net Balance = ${debitBalance} - ${creditBalance} = ${netBalance}`);
      } else {
        netBalance = creditBalance - debitBalance;
        isDebitBalance = netBalance < 0;
        netBalance = Math.abs(netBalance);
        console.log(`  📈 Liability/Equity/Revenue account: Net Balance = |${creditBalance} - ${debitBalance}| = ${netBalance}`);
      }
      
      console.log(`  🎯 Final Balance: ${netBalance} (${isDebitBalance ? 'Debit' : 'Credit'})`);
      console.log(`  ✅ Should appear in trial balance: ${Math.abs(netBalance) > 0.01 ? 'YES' : 'NO'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugBalanceCalculation();