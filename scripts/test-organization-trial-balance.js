import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrialBalanceService from '../lib/services/TrialBalanceService.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testOrganizationTrialBalance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    const asOfDate = new Date();
    
    console.log(`\n🧪 Testing Trial Balance for organization: ${orgId}`);
    console.log(`📅 As of Date: ${asOfDate.toDateString()}`);
    
    // Generate trial balance
    const trialBalance = await TrialBalanceService.generateTrialBalance(orgId, asOfDate);
    
    console.log('\n📊 TRIAL BALANCE RESULTS');
    console.log('========================');
    console.log(`As of: ${new Date(trialBalance.asOfDate).toLocaleDateString()}`);
    console.log(`Total Accounts: ${trialBalance.summary.totalAccounts}`);
    console.log(`Accounts with Debit Balance: ${trialBalance.summary.accountsWithDebitBalance}`);
    console.log(`Accounts with Credit Balance: ${trialBalance.summary.accountsWithCreditBalance}`);
    console.log(`Total Debits: $${trialBalance.totals.totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${trialBalance.totals.totalCredits.toFixed(2)}`);
    console.log(`Difference: $${trialBalance.totals.difference.toFixed(2)}`);
    console.log(`Is Balanced: ${trialBalance.totals.isBalanced ? '✅ YES' : '❌ NO'}`);
    
    if (trialBalance.accounts.length > 0) {
      console.log('\n📊 ACCOUNT BALANCES');
      console.log('===================');
      console.log('Code    | Name                  | Type          | Debit         | Credit');
      console.log('----    | ----                  | ----          | -----         | ------');
      
      trialBalance.accounts.forEach(account => {
        const code = account.accountCode.padEnd(7);
        const name = account.accountName.padEnd(20);
        const type = account.accountType.padEnd(13);
        const debit = account.debitAmount > 0 ? `$${account.debitAmount.toFixed(2)}`.padStart(13) : '-'.padStart(13);
        const credit = account.creditAmount > 0 ? `$${account.creditAmount.toFixed(2)}`.padStart(13) : '-'.padStart(13);
        
        console.log(`${code} | ${name} | ${type} | ${debit} | ${credit}`);
      });
      
      console.log('----    | ----                  | ----          | -----         | ------');
      console.log(`TOTAL   |                       |               | $${trialBalance.totals.totalDebits.toFixed(2).padStart(11)} | $${trialBalance.totals.totalCredits.toFixed(2).padStart(11)}`);
      
      console.log('\n🔍 Account Code Verification:');
      trialBalance.accounts.forEach(account => {
        if (account.accountCode.includes(' ') || account.accountCode.includes(':') || account.accountCode.length > 10) {
          console.log(`❌ Account "${account.accountCode}" still has problematic code format`);
        } else {
          console.log(`✅ Account "${account.accountCode}" has proper numeric code`);
        }
      });
      
    } else {
      console.log('\nℹ️  No accounts with balances found.');
    }
    
    // Test CSV export
    console.log('\n📄 Testing CSV Export...');
    const csvData = TrialBalanceService.exportToCSV(trialBalance);
    console.log(`✅ CSV export successful (${csvData.length} characters)`);
    
    console.log('\n🎉 Trial Balance test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing trial balance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testOrganizationTrialBalance();