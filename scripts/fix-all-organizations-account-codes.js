import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixAllOrganizationsAccountCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all organizations that have accounts
    const organizations = await ChartOfAccount.distinct('organization');
    console.log(`\n📊 Found ${organizations.length} organizations with accounts`);

    let totalFixed = 0;
    let totalErrors = 0;

    for (const orgId of organizations) {
      if (!orgId) continue; // Skip null organization IDs
      
      console.log(`\n🏢 Processing Organization: ${orgId}`);
      console.log('='.repeat(50));

      // Get all problematic accounts for this organization
      const problematicAccounts = await ChartOfAccount.find({
        organization: orgId,
        $or: [
          { code: { $regex: /\s/ } }, // Contains spaces
          { code: { $regex: /:/ } },  // Contains colons
          { code: { $regex: /^[^0-9]/ } } // Doesn't start with number
        ]
      });

      if (problematicAccounts.length === 0) {
        console.log('✅ No problematic accounts found for this organization');
        continue;
      }

      console.log(`🔍 Found ${problematicAccounts.length} problematic accounts`);

      // Get all existing codes globally to avoid duplicates
      const allExistingCodes = await ChartOfAccount.distinct('code');
      const existingCodesSet = new Set(allExistingCodes);

      // Define code ranges for different account types
      const codeRanges = {
        asset: { start: 1000, current: 1000 },
        liability: { start: 2000, current: 2000 },
        equity: { start: 3000, current: 3000 },
        revenue: { start: 4000, current: 4000 },
        expense: { start: 5000, current: 5000 }
      };

      // Function to find next available code in a range
      function findNextAvailableCode(accountType) {
        const range = codeRanges[accountType];
        if (!range) return findNextAvailableCode('asset'); // Default to asset range

        let code = range.current;
        while (existingCodesSet.has(code.toString())) {
          code++;
        }
        range.current = code + 1; // Update for next use
        return code.toString();
      }

      let orgFixed = 0;
      let orgErrors = 0;

      for (const account of problematicAccounts) {
        try {
          const newCode = findNextAvailableCode(account.type);
          
          console.log(`  🔧 ${account.name}: "${account.code}" → "${newCode}" (${account.type})`);

          // Update the account
          const updateResult = await ChartOfAccount.updateOne(
            { _id: account._id },
            { $set: { code: newCode } }
          );

          if (updateResult.modifiedCount > 0) {
            existingCodesSet.add(newCode); // Add to set to avoid future duplicates
            orgFixed++;
            totalFixed++;
          } else {
            console.log(`    ❌ Failed to update`);
            orgErrors++;
            totalErrors++;
          }

        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          orgErrors++;
          totalErrors++;
        }
      }

      console.log(`📊 Organization Summary: ✅ ${orgFixed} fixed, ❌ ${orgErrors} errors`);
    }

    console.log(`\n🎉 GLOBAL SUMMARY`);
    console.log('='.repeat(30));
    console.log(`✅ Total accounts fixed: ${totalFixed}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`🏢 Organizations processed: ${organizations.length}`);

    // Final verification - check if any problematic accounts remain
    const remainingProblematic = await ChartOfAccount.find({
      $or: [
        { code: { $regex: /\s/ } }, // Contains spaces
        { code: { $regex: /:/ } },  // Contains colons
        { code: { $regex: /^[^0-9]/ } } // Doesn't start with number
      ]
    });

    if (remainingProblematic.length === 0) {
      console.log('\n✅ ALL ACCOUNT CODES ARE NOW PROPERLY FORMATTED ACROSS ALL ORGANIZATIONS!');
    } else {
      console.log(`\n⚠️  ${remainingProblematic.length} accounts still have problematic codes:`);
      remainingProblematic.forEach(acc => {
        console.log(`   - Org: ${acc.organization} | Code: "${acc.code}" | Name: "${acc.name}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAllOrganizationsAccountCodes();