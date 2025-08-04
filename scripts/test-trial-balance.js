/**
 * Test script for Trial Balance functionality
 * Run with: node scripts/test-trial-balance.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrialBalanceService from '../lib/services/TrialBalanceService.js';
import Organization from '../lib/models/Organization.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testTrialBalance() {
  try {
    console.log('🧪 Testing Trial Balance functionality...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first organization
    const organization = await Organization.findOne();
    if (!organization) {
      console.log('❌ No organization found. Please create an organization first.');
      return;
    }

    console.log(`📊 Generating trial balance for: ${organization.name}`);
    console.log(`🆔 Organization ID: ${organization._id}\n`);

    // Generate trial balance
    const trialBalance = await TrialBalanceService.generateTrialBalance(
      organization._id.toString(),
      new Date()
    );

    // Display results
    console.log('📋 TRIAL BALANCE RESULTS');
    console.log('========================');
    console.log(`As of: ${new Date(trialBalance.asOfDate).toLocaleDateString()}`);
    console.log(`Total Accounts: ${trialBalance.summary.totalAccounts}`);
    console.log(`Accounts with Debit Balance: ${trialBalance.summary.accountsWithDebitBalance}`);
    console.log(`Accounts with Credit Balance: ${trialBalance.summary.accountsWithCreditBalance}`);
    console.log(`Total Debits: $${trialBalance.totals.totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${trialBalance.totals.totalCredits.toFixed(2)}`);
    console.log(`Difference: $${trialBalance.totals.difference.toFixed(2)}`);
    console.log(`Is Balanced: ${trialBalance.totals.isBalanced ? '✅ YES' : '❌ NO'}\n`);

    // Display account details
    if (trialBalance.accounts.length > 0) {
      console.log('📊 ACCOUNT BALANCES');
      console.log('===================');
      console.log('Code\t| Name\t\t\t| Type\t\t| Debit\t\t| Credit');
      console.log('----\t| ----\t\t\t| ----\t\t| -----\t\t| ------');
      
      trialBalance.accounts.forEach(account => {
        const name = account.accountName.padEnd(20);
        const type = account.accountType.padEnd(10);
        const debit = account.debitAmount > 0 ? `$${account.debitAmount.toFixed(2)}` : '-';
        const credit = account.creditAmount > 0 ? `$${account.creditAmount.toFixed(2)}` : '-';
        
        console.log(`${account.accountCode}\t| ${name}\t| ${type}\t| ${debit.padEnd(10)}\t| ${credit}`);
      });
      
      console.log('----\t| ----\t\t\t| ----\t\t| -----\t\t| ------');
      console.log(`TOTAL\t| \t\t\t| \t\t| $${trialBalance.totals.totalDebits.toFixed(2).padEnd(10)}\t| $${trialBalance.totals.totalCredits.toFixed(2)}`);
    } else {
      console.log('ℹ️  No accounts with balances found.');
    }

    // Validate trial balance
    const validation = TrialBalanceService.validateTrialBalance(trialBalance);
    console.log('\n🔍 VALIDATION RESULTS');
    console.log('====================');
    console.log(`Overall Valid: ${validation.isValid ? '✅ YES' : '❌ NO'}`);
    
    if (validation.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      validation.errors.forEach(error => {
        console.log(`  - ${error.message}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      validation.warnings.forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
    }

    // Test CSV export
    console.log('\n📄 Testing CSV Export...');
    const csvContent = TrialBalanceService.exportToCSV(trialBalance);
    console.log(`✅ CSV export successful (${csvContent.length} characters)`);

    console.log('\n🎉 Trial Balance test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing trial balance:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTrialBalance();