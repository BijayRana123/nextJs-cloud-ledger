import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixAccountCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808baf5f691bbb5e9fd1d5b';
    
    // Find accounts with problematic codes
    const problematicAccounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId),
      $or: [
        { code: { $regex: /\s/ } }, // Contains spaces
        { code: { $regex: /:/ } },  // Contains colons
        { code: { $regex: /^[^0-9]/ } } // Doesn't start with number
      ]
    });
    
    console.log(`\n🔍 Found ${problematicAccounts.length} accounts with problematic codes:`);
    
    for (const account of problematicAccounts) {
      console.log(`\n❌ Problematic Account:`);
      console.log(`   Code: "${account.code}"`);
      console.log(`   Name: "${account.name}"`);
      console.log(`   Path: "${account.path}"`);
      
      // Generate a proper code based on the account type and existing codes
      let newCode;
      
      if (account.path === 'Assets:Bharat') {
        // This looks like a customer account under Assets
        // Find all existing codes to avoid duplicates
        const allAccounts = await ChartOfAccount.find({
          organization: new mongoose.Types.ObjectId(orgId)
        });
        
        const existingCodes = new Set(allAccounts.map(acc => acc.code));
        
        // Generate next available asset code (1000-1999 range)
        for (let code = 1500; code < 2000; code++) {
          if (!existingCodes.has(code.toString())) {
            newCode = code.toString();
            break;
          }
        }
      }
      
      if (newCode) {
        console.log(`   ✅ Suggested new code: "${newCode}"`);
        
        // Update the account
        const updateResult = await ChartOfAccount.updateOne(
          { _id: account._id },
          { $set: { code: newCode } }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`   ✅ Successfully updated account code`);
        } else {
          console.log(`   ❌ Failed to update account code`);
        }
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verification - Checking all accounts after fix:');
    const allAccounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ code: 1 });
    
    let hasProblems = false;
    allAccounts.forEach(acc => {
      if (acc.code && (acc.code.includes(' ') || acc.code.includes(':') || acc.code.length > 10)) {
        console.log(`❌ Still problematic: Code "${acc.code}" | Name "${acc.name}"`);
        hasProblems = true;
      }
    });
    
    if (!hasProblems) {
      console.log('✅ All account codes are now properly formatted!');
    }
    
    // Show accounts that will appear in trial balance
    console.log('\n📊 Accounts that should appear in trial balance:');
    const accountsWithTxns = [
      'Assets:Current Assets',
      'Assets:Current Assets:Cash and Bank', 
      'Assets:Current Assets:Accounts Receivable',
      'Liabilities:Current Liabilities:Accounts Payable',
      'Equity:Owner\'s Drawings',
      'Expenses:Salaries and Wages'
    ];
    
    for (const path of accountsWithTxns) {
      const account = await ChartOfAccount.findOne({
        path: path,
        organization: new mongoose.Types.ObjectId(orgId)
      });
      
      if (account) {
        console.log(`✅ ${account.code} - ${account.name} (${account.type})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAccountCodes();