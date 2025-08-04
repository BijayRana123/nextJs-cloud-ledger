import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixOrganizationAccountCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    
    // Get all accounts for the organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ path: 1 });
    
    console.log(`\n📊 Found ${accounts.length} accounts to fix`);
    
    // Define code ranges for different account types
    const codeRanges = {
      asset: { start: 1000, current: 1000 },
      liability: { start: 2000, current: 2000 },
      equity: { start: 3000, current: 3000 },
      revenue: { start: 4000, current: 4000 },
      expense: { start: 5000, current: 5000 }
    };
    
    let fixedCount = 0;
    let errors = [];
    
    for (const account of accounts) {
      try {
        // Generate new code based on account type
        const accountType = account.type;
        if (!codeRanges[accountType]) {
          console.log(`⚠️  Unknown account type: ${accountType} for account ${account.name}`);
          continue;
        }
        
        const newCode = codeRanges[accountType].current.toString();
        codeRanges[accountType].current++;
        
        console.log(`\n🔧 Fixing account: "${account.name}"`);
        console.log(`   Old Code: "${account.code}"`);
        console.log(`   New Code: "${newCode}"`);
        console.log(`   Type: ${accountType}`);
        console.log(`   Path: "${account.path}"`);
        
        // Update the account
        const updateResult = await ChartOfAccount.updateOne(
          { _id: account._id },
          { $set: { code: newCode } }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`   ✅ Successfully updated`);
          fixedCount++;
        } else {
          console.log(`   ❌ Failed to update`);
          errors.push(`Failed to update ${account.name}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating ${account.name}: ${error.message}`);
        errors.push(`Error updating ${account.name}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully fixed: ${fixedCount} accounts`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Error details:`);
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Verify the fix
    console.log('\n🔍 Verification - Checking accounts after fix:');
    const updatedAccounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ code: 1 });
    
    let stillProblematic = 0;
    updatedAccounts.forEach(acc => {
      if (acc.code && (acc.code.includes(' ') || acc.code.includes(':') || acc.code.length > 10)) {
        console.log(`❌ Still problematic: Code "${acc.code}" | Name "${acc.name}"`);
        stillProblematic++;
      }
    });
    
    if (stillProblematic === 0) {
      console.log('✅ All account codes are now properly formatted!');
      
      // Show sample of fixed accounts
      console.log('\n📋 Sample of fixed accounts:');
      updatedAccounts.slice(0, 10).forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
      
      if (updatedAccounts.length > 10) {
        console.log(`   ... and ${updatedAccounts.length - 10} more accounts`);
      }
    } else {
      console.log(`❌ ${stillProblematic} accounts still have problematic codes`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixOrganizationAccountCodes();