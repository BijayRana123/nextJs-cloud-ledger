import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function testLedgerFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models after connection
    const { Ledger } = await import('../lib/models.js');
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;

    const accountId = '689c561cff19cbbcd3d00a64';
    
    console.log('\n=== TESTING LEDGER FIX FOR ID:', accountId, '===');
    
    // First check if it's a Ledger
    const ledger = await Ledger.findById(accountId).populate('group organization');
    if (!ledger) {
      console.log('❌ Ledger not found');
      return;
    }
    
    console.log('✅ Found Ledger:');
    console.log(`   Name: ${ledger.name}`);
    console.log(`   Group: ${ledger.group?.name}`);
    console.log(`   Organization: ${ledger.organization?.name} (${ledger.organization?._id})`);
    
    // Now find the associated ChartOfAccount
    const orgId = ledger.organization._id.toString();
    const groupName = ledger.group?.name || 'Misc';
    const code = `${groupName}:${ledger.name}`;
    
    const account = await ChartOfAccount.findOne({ 
      code, 
      organization: orgId, 
      name: ledger.name 
    });
    
    if (!account) {
      console.log('❌ Associated ChartOfAccount not found');
      return;
    }
    
    console.log('✅ Associated ChartOfAccount found:');
    console.log(`   Name: ${account.name}`);
    console.log(`   Path: ${account.path}`);
    console.log(`   Organization: ${account.organization}`);
    
    // Simulate the new query logic
    const pathParts = account.path.split(':');
    const accountType = pathParts[0]; // "Accounts Payable"
    const accountName = pathParts[pathParts.length - 1]; // "xyz vendor"
    
    console.log(`\nAccount type: ${accountType}`);
    console.log(`Account name: ${accountName}`);
    
    // Test the regex pattern
    if (accountType === 'Accounts Payable') {
      const mediciAccountPath = 'Liabilities:Accounts Payable';
      const leafNameRegex = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = `${mediciAccountPath}:${leafNameRegex}$`;
      
      console.log(`\nRegex pattern: ${regexPattern}`);
      console.log(`Case insensitive: true`);
      
      // Test the query
      const db = mongoose.connection.db;
      const transactionCollection = db.collection('medici_transactions');
      
      const query = {
        accounts: { 
          $regex: regexPattern, 
          $options: 'i' 
        },
        voided: { $ne: true },
        organizationId: new mongoose.Types.ObjectId(orgId)
      };
      
      console.log('\nExecuting query...');
      const transactions = await transactionCollection
        .find(query)
        .sort({ datetime: -1 })
        .limit(10)
        .toArray();
        
      console.log(`✅ Found ${transactions.length} transactions!`);
      
      if (transactions.length > 0) {
        console.log('\nTransactions:');
        transactions.forEach((tx, idx) => {
          const accounts = Array.isArray(tx.accounts) ? tx.accounts.join(', ') : tx.accounts;
          console.log(`   ${idx + 1}. ${tx.datetime?.toISOString()} - ${tx.memo || 'No memo'}`);
          console.log(`      Accounts: ${accounts}`);
          console.log(`      Amount: ${tx.debit ? 'DR' : 'CR'} ${tx.amount}`);
        });
      }
      
      // Test a few variations to show what it matches
      console.log('\n=== TESTING WHAT THE REGEX MATCHES ===');
      const testPaths = [
        'Liabilities:Accounts Payable:xyz vendor',
        'Liabilities:Accounts Payable:Xyz vendor', 
        'Liabilities:Accounts Payable:XYZ VENDOR',
        'Liabilities:Accounts Payable:xyz vendorX', // This should NOT match
        'Assets:Accounts Receivable:xyz vendor', // This should NOT match
      ];
      
      testPaths.forEach(testPath => {
        const regex = new RegExp(regexPattern, 'i');
        const matches = regex.test(testPath);
        console.log(`   "${testPath}" ${matches ? '✅ MATCHES' : '❌ does not match'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testLedgerFix();