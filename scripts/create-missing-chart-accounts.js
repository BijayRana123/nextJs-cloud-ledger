import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Helper function to generate proper numeric account codes
async function generateAccountCode(accountType, orgId) {
  const codeRanges = {
    asset: { start: 1000, max: 1999 },
    liability: { start: 2000, max: 2999 },
    equity: { start: 3000, max: 3999 },
    revenue: { start: 4000, max: 4999 },
    expense: { start: 5000, max: 5999 }
  };
  
  const range = codeRanges[accountType] || codeRanges.asset;
  
  // Find the highest existing code for this account type and organization
  const existingAccounts = await ChartOfAccount.find({
    organization: orgId,
    type: accountType,
    code: { $regex: /^\d+$/ } // Only numeric codes
  }).sort({ code: -1 }).limit(1);
  
  let nextCode = range.start;
  if (existingAccounts.length > 0) {
    const lastCode = parseInt(existingAccounts[0].code);
    if (lastCode >= range.start && lastCode < range.max) {
      nextCode = lastCode + 1;
    }
  }
  
  // Ensure we don't exceed the range
  if (nextCode > range.max) {
    nextCode = range.start;
  }
  
  // Check if this code already exists globally (across all organizations)
  let codeExists = await ChartOfAccount.findOne({ code: nextCode.toString() });
  while (codeExists && nextCode <= range.max) {
    nextCode++;
    codeExists = await ChartOfAccount.findOne({ code: nextCode.toString() });
  }
  
  return nextCode.toString();
}

// Function to determine account type from path
function getAccountTypeFromPath(path) {
  if (path.startsWith('Assets:')) return 'asset';
  if (path.startsWith('Liabilities:')) return 'liability';
  if (path.startsWith('Equity:')) return 'equity';
  if (path.startsWith('Revenue:') || path.startsWith('Income:')) return 'revenue';
  if (path.startsWith('Expenses:')) return 'expense';
  if (path.startsWith('Inventory:')) return 'asset'; // Inventory is an asset
  return 'asset'; // Default to asset
}

// Function to get account name from path
function getAccountNameFromPath(path) {
  const parts = path.split(':');
  return parts[parts.length - 1]; // Last part is the name
}

async function createMissingChartAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    
    // Get all unique transaction paths for this organization
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const uniqueAccountPaths = await transactionCollection.distinct('accounts', {
      organizationId: new mongoose.Types.ObjectId(orgId),
      accounts: { $ne: null, $ne: '' }
    });
    
    console.log(`\n📊 Found ${uniqueAccountPaths.length} unique account paths in transactions`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const accountPath of uniqueAccountPaths) {
      try {
        // Check if ChartOfAccount already exists
        const existingAccount = await ChartOfAccount.findOne({
          path: accountPath,
          organization: new mongoose.Types.ObjectId(orgId)
        });
        
        if (existingAccount) {
          console.log(`⚪ Skipping "${accountPath}" - already exists (Code: ${existingAccount.code})`);
          skipped++;
          continue;
        }
        
        // Determine account type and generate code
        const accountType = getAccountTypeFromPath(accountPath);
        const accountName = getAccountNameFromPath(accountPath);
        const code = await generateAccountCode(accountType, new mongoose.Types.ObjectId(orgId));
        
        // Create the ChartOfAccount entry
        const newAccount = await ChartOfAccount.create({
          code,
          name: accountName,
          type: accountType,
          subtype: accountType === 'asset' ? 'current' : 
                   accountType === 'liability' ? 'current_liability' :
                   accountType === 'revenue' ? 'operating_revenue' :
                   accountType === 'expense' ? 'operating_expense' : 'capital',
          path: accountPath,
          organization: new mongoose.Types.ObjectId(orgId),
          active: true,
          description: `Auto-created for existing transactions`
        });
        
        console.log(`✅ Created "${accountPath}" → Code: ${code} (${accountType})`);
        created++;
        
      } catch (error) {
        console.log(`❌ Error creating account for "${accountPath}": ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Created: ${created} accounts`);
    console.log(`⚪ Skipped: ${skipped} accounts (already existed)`);
    console.log(`❌ Errors: ${errors} accounts`);
    
    // Test the trial balance now
    console.log('\n🧪 Testing trial balance after creating missing accounts...');
    
    const TrialBalanceService = (await import('../lib/services/TrialBalanceService.js')).default;
    const trialBalance = await TrialBalanceService.generateTrialBalance(orgId, new Date());
    
    console.log(`\n📊 UPDATED TRIAL BALANCE:`);
    console.log(`Total Accounts: ${trialBalance.summary.totalAccounts}`);
    console.log(`Total Debits: $${trialBalance.totals.totalDebits.toFixed(2)}`);
    console.log(`Total Credits: $${trialBalance.totals.totalCredits.toFixed(2)}`);
    console.log(`Is Balanced: ${trialBalance.totals.isBalanced ? '✅ YES' : '❌ NO'}`);
    
    if (trialBalance.accounts.length > 0) {
      console.log('\n📋 Accounts in Trial Balance:');
      trialBalance.accounts.forEach(account => {
        const debit = account.debitAmount > 0 ? `$${account.debitAmount.toFixed(2)}` : '-';
        const credit = account.creditAmount > 0 ? `$${account.creditAmount.toFixed(2)}` : '-';
        console.log(`  ${account.accountCode} - ${account.accountName} | Debit: ${debit} | Credit: ${credit}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createMissingChartAccounts();