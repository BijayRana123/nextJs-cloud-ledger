import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixRemainingAccountCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    
    // Get accounts that still have problematic codes
    const problematicAccounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId),
      $or: [
        { code: { $regex: /\s/ } }, // Contains spaces
        { code: { $regex: /:/ } },  // Contains colons
        { code: { $regex: /^[^0-9]/ } } // Doesn't start with number
      ]
    });
    
    console.log(`\n🔍 Found ${problematicAccounts.length} accounts still needing fixes:`);
    
    // Get all existing codes to avoid duplicates
    const allExistingCodes = await ChartOfAccount.distinct('code');
    const existingCodesSet = new Set(allExistingCodes);
    
    console.log(`📊 Found ${allExistingCodes.length} existing codes in database`);
    
    // Function to find next available code in a range
    function findNextAvailableCode(startCode, accountType) {
      let code = startCode;
      while (existingCodesSet.has(code.toString())) {
        code++;
      }
      return code.toString();
    }
    
    for (const account of problematicAccounts) {
      try {
        let newCode;
        
        // Determine code range based on account type
        switch (account.type) {
          case 'asset':
            newCode = findNextAvailableCode(1500, 'asset');
            break;
          case 'liability':
            newCode = findNextAvailableCode(2500, 'liability');
            break;
          case 'equity':
            newCode = findNextAvailableCode(3500, 'equity');
            break;
          case 'revenue':
            newCode = findNextAvailableCode(4500, 'revenue');
            break;
          case 'expense':
            newCode = findNextAvailableCode(5500, 'expense');
            break;
          default:
            newCode = findNextAvailableCode(9000, 'other');
        }
        
        console.log(`\n🔧 Fixing account: "${account.name}"`);
        console.log(`   Old Code: "${account.code}"`);
        console.log(`   New Code: "${newCode}"`);
        console.log(`   Type: ${account.type}`);
        console.log(`   Path: "${account.path}"`);
        
        // Update the account
        const updateResult = await ChartOfAccount.updateOne(
          { _id: account._id },
          { $set: { code: newCode } }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`   ✅ Successfully updated`);
          existingCodesSet.add(newCode); // Add to set to avoid future duplicates
        } else {
          console.log(`   ❌ Failed to update`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating ${account.name}: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification:');
    const finalCheck = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId),
      $or: [
        { code: { $regex: /\s/ } }, // Contains spaces
        { code: { $regex: /:/ } },  // Contains colons
        { code: { $regex: /^[^0-9]/ } } // Doesn't start with number
      ]
    });
    
    if (finalCheck.length === 0) {
      console.log('✅ All account codes are now properly formatted!');
      
      // Show all accounts for this organization
      const allAccounts = await ChartOfAccount.find({
        organization: new mongoose.Types.ObjectId(orgId)
      }).sort({ code: 1 });
      
      console.log(`\n📋 All ${allAccounts.length} accounts for organization:`);
      allAccounts.forEach(acc => {
        console.log(`   ${acc.code} - ${acc.name} (${acc.type})`);
      });
      
    } else {
      console.log(`❌ ${finalCheck.length} accounts still have problematic codes:`);
      finalCheck.forEach(acc => {
        console.log(`   - "${acc.code}" (${acc.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixRemainingAccountCodes();