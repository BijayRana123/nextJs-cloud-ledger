import dbConnect from '../lib/dbConnect.js';
import { Ledger, LedgerGroup } from '../lib/models.js';

async function addCodesToLedgers() {
  await dbConnect();
  
  try {
    console.log('🚀 Starting to add codes to ledgers and groups...');
    
    // Get all organizations to process each separately
    const organizations = await LedgerGroup.distinct('organization');
    console.log(`Found ${organizations.length} organizations`);
    
    for (const orgId of organizations) {
      console.log(`\n📋 Processing organization: ${orgId}`);
      
      // Process LedgerGroups first
      const groups = await LedgerGroup.find({ organization: orgId }).sort({ createdAt: 1 });
      console.log(`  Found ${groups.length} ledger groups`);
      
      let groupCodeCounter = 1000;
      for (const group of groups) {
        if (!group.code) {
          const newCode = groupCodeCounter.toString();
          await LedgerGroup.findByIdAndUpdate(group._id, { code: newCode });
          console.log(`  ✅ Updated group "${group.name}" with code: ${newCode}`);
          groupCodeCounter += 100; // Increment by 100 for groups
        } else {
          console.log(`  ⏭️  Group "${group.name}" already has code: ${group.code}`);
        }
      }
      
      // Process Ledgers
      const ledgers = await Ledger.find({ organization: orgId }).populate('group').sort({ createdAt: 1 });
      console.log(`  Found ${ledgers.length} ledgers`);
      
      // Group ledgers by their group and assign codes
      const ledgersByGroup = {};
      ledgers.forEach(ledger => {
        const groupId = ledger.group._id.toString();
        if (!ledgersByGroup[groupId]) {
          ledgersByGroup[groupId] = [];
        }
        ledgersByGroup[groupId].push(ledger);
      });
      
      for (const [groupId, groupLedgers] of Object.entries(ledgersByGroup)) {
        const group = await LedgerGroup.findById(groupId);
        const baseCode = parseInt(group.code || '1000');
        let ledgerCounter = 1;
        
        for (const ledger of groupLedgers) {
          if (!ledger.code) {
            // Create sub-codes like 1001, 1002, etc. under group 1000
            const newCode = (baseCode + ledgerCounter).toString();
            await Ledger.findByIdAndUpdate(ledger._id, { code: newCode });
            console.log(`  ✅ Updated ledger "${ledger.name}" with code: ${newCode}`);
            ledgerCounter++;
          } else {
            console.log(`  ⏭️  Ledger "${ledger.name}" already has code: ${ledger.code}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Successfully added codes to all ledgers and groups!');
    
  } catch (error) {
    console.error('❌ Error adding codes:', error);
  } finally {
    process.exit(0);
  }
}

addCodesToLedgers();