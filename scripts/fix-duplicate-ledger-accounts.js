import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function fixDuplicateLedgerAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models
    const { Ledger } = await import('../lib/models.js');
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;

    console.log('\n=== ANALYZING DUPLICATE ISSUES ===');
    
    // 1. Find ChartOfAccount entries with duplicate codes
    const duplicateCodes = await ChartOfAccount.aggregate([
      {
        $group: {
          _id: { code: "$code", organization: "$organization" },
          count: { $sum: 1 },
          docs: { $push: "$$ROOT" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`Found ${duplicateCodes.length} duplicate code groups in ChartOfAccounts`);
    
    for (const group of duplicateCodes) {
      console.log(`\nDuplicate code: ${group._id.code} (Organization: ${group._id.organization})`);
      console.log('Documents:');
      group.docs.forEach((doc, idx) => {
        console.log(`  ${idx + 1}. ID: ${doc._id}, Name: ${doc.name}, Path: ${doc.path}`);
      });
      
      // Keep the first one, mark others for potential cleanup
      const docsToRemove = group.docs.slice(1);
      console.log(`  -> Would remove ${docsToRemove.length} duplicate(s)`);
      
      // Actually remove duplicates (uncomment the line below to execute)
      // await ChartOfAccount.deleteMany({ _id: { $in: docsToRemove.map(d => d._id) } });
    }

    // 2. Find ChartOfAccount entries that may be missing for existing Ledgers
    const ledgers = await Ledger.find({}).populate('group organization');
    console.log(`\n=== CHECKING ${ledgers.length} LEDGERS FOR MISSING CHART OF ACCOUNTS ===`);
    
    let missingCount = 0;
    for (const ledger of ledgers) {
      const groupName = ledger.group?.name || 'Misc';
      const code = `${groupName}:${ledger.name}`;
      
      const existingCoa = await ChartOfAccount.findOne({ 
        code, 
        organization: ledger.organization._id 
      });
      
      if (!existingCoa) {
        missingCount++;
        console.log(`Missing ChartOfAccount for ledger: ${ledger.name} (Group: ${groupName})`);
        
        // Create the missing ChartOfAccount (uncomment to execute)
        // const path = `${groupName}:${ledger.name}`;
        // let type = 'asset';
        // let subtype = 'current';
        // if (/liab/i.test(groupName)) { type = 'liability'; subtype = 'current_liability'; }
        // if (/revenue|income|sales/i.test(groupName)) { type = 'revenue'; subtype = 'operating_revenue'; }
        // if (/expense/i.test(groupName)) { type = 'expense'; subtype = 'operating_expense'; }
        // if (/equity/i.test(groupName)) { type = 'equity'; subtype = 'capital'; }
        // if (/cash/i.test(ledger.name)) { type = 'asset'; subtype = 'current'; }
        
        // await ChartOfAccount.create({
        //   name: ledger.name,
        //   path,
        //   type,
        //   code,
        //   subtype,
        //   organization: ledger.organization._id,
        //   active: true,
        // });
        // console.log(`  -> Created ChartOfAccount for ${ledger.name}`);
      }
    }
    
    console.log(`\nFound ${missingCount} ledgers without ChartOfAccounts`);

    // 3. Check for common problematic account names
    console.log('\n=== CHECKING FOR COMMON PROBLEMATIC ACCOUNTS ===');
    
    const problematicNames = ['Cash', 'cash', 'Sales Revenue', 'sales revenue'];
    for (const name of problematicNames) {
      const ledgerCount = await Ledger.countDocuments({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      const coaCount = await ChartOfAccount.countDocuments({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      
      console.log(`"${name}": ${ledgerCount} Ledgers, ${coaCount} ChartOfAccounts`);
      
      if (ledgerCount > 0 || coaCount > 0) {
        // Find specific instances
        const ledgerInstances = await Ledger.find({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
          .populate('organization', 'name')
          .limit(5);
        const coaInstances = await ChartOfAccount.find({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
          .populate('organization', 'name')
          .limit(5);
          
        ledgerInstances.forEach(l => {
          console.log(`  Ledger: ${l.name} (${l.organization?.name})`);
        });
        coaInstances.forEach(c => {
          console.log(`  ChartOfAccount: ${c.name} -> ${c.path} (${c.organization?.name})`);
        });
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log('This script analyzed your data for potential issues.');
    console.log('To actually fix the issues, uncomment the relevant lines in the script and run again.');
    console.log('\nRecommendations:');
    console.log('1. Remove duplicate ChartOfAccount entries');
    console.log('2. Create missing ChartOfAccount entries for existing Ledgers'); 
    console.log('3. Ensure consistent naming conventions');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixDuplicateLedgerAccounts();