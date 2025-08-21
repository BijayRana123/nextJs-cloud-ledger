import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function debugLedgerSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models after connection
    const { Ledger } = await import('../lib/models.js');
    const ChartOfAccount = (await import('../lib/models/ChartOfAccounts.js')).default;
    const Organization = (await import('../lib/models/Organization.js')).default;

    const accountId = '689c561cff19cbbcd3d00a64';
    
    console.log('\n=== DEBUGGING LEDGER SYSTEM FOR ID:', accountId, '===');
    
    // Check if it exists as a Ledger
    console.log('\n1. CHECKING AS LEDGER:');
    const ledger = await Ledger.findById(accountId).populate('group organization');
    
    if (ledger) {
      console.log('✅ Found as Ledger:');
      console.log(`   Name: ${ledger.name}`);
      console.log(`   Code: ${ledger.code}`);
      console.log(`   Group: ${ledger.group?.name}`);
      console.log(`   Organization: ${ledger.organization?.name} (${ledger.organization?._id})`);
      console.log(`   Opening Balance: ${ledger.openingBalance || 0}`);
    } else {
      console.log('❌ Not found as Ledger');
    }
    
    // Check if it exists as a ChartOfAccount
    console.log('\n2. CHECKING AS CHART OF ACCOUNT:');
    const coa = await ChartOfAccount.findById(accountId).populate('organization');
    
    if (coa) {
      console.log('✅ Found as ChartOfAccount:');
      console.log(`   Name: ${coa.name}`);
      console.log(`   Code: ${coa.code}`);
      console.log(`   Path: ${coa.path}`);
      console.log(`   Type: ${coa.type}`);
      console.log(`   Organization: ${coa.organization?.name} (${coa.organization?._id})`);
    } else {
      console.log('❌ Not found as ChartOfAccount');
    }
    
    // If found as Ledger, test the API endpoint
    if (ledger) {
      console.log('\n3. TESTING LEDGER API ENDPOINT:');
      const orgId = ledger.organization._id.toString();
      
      // Simulate the API call
      try {
        const response = await fetch(`http://localhost:3000/api/accounting/ledgers/${accountId}`, {
          headers: { 'x-organization-id': orgId },
        });
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ API call successful');
          console.log('   Ledger:', data.ledger?.name);
          console.log('   ChartOfAccount ID:', data.chartOfAccount?._id);
          console.log('   ChartOfAccount Path:', data.chartOfAccount?.path);
        } else {
          console.log('❌ API call failed:', data.error);
        }
      } catch (error) {
        console.log('❌ API call error:', error.message);
        console.log('   (This is expected if the server is not running)');
      }
    }
    
    // List some recent ledgers to understand the data structure
    console.log('\n4. RECENT LEDGERS IN SYSTEM:');
    const recentLedgers = await Ledger.find()
      .populate('organization', 'name')
      .populate('group', 'name')
      .sort({ _id: -1 })
      .limit(5);
      
    if (recentLedgers.length > 0) {
      console.log('Recent ledgers:');
      recentLedgers.forEach((l, idx) => {
        console.log(`${idx + 1}. ${l.name} (${l._id}) - Org: ${l.organization?.name} - Group: ${l.group?.name}`);
      });
    } else {
      console.log('No ledgers found');
    }
    
    // List some recent ChartOfAccounts
    console.log('\n5. RECENT CHART OF ACCOUNTS:');
    const recentCOAs = await ChartOfAccount.find()
      .populate('organization', 'name')
      .sort({ _id: -1 })
      .limit(5);
      
    if (recentCOAs.length > 0) {
      console.log('Recent Chart of Accounts:');
      recentCOAs.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.name} (${c._id}) - Org: ${c.organization?.name} - Path: ${c.path}`);
      });
    } else {
      console.log('No Chart of Accounts found');
    }
    
    // Check for purchase voucher related accounts
    console.log('\n6. CHECKING FOR PURCHASE-RELATED ACCOUNTS:');
    const purchaseAccounts = await ChartOfAccount.find({
      $or: [
        { path: { $regex: /purchase/i } },
        { name: { $regex: /purchase/i } },
        { path: { $regex: /payable/i } },
        { name: { $regex: /payable/i } }
      ]
    }).populate('organization', 'name').limit(10);
    
    if (purchaseAccounts.length > 0) {
      console.log('Purchase-related accounts:');
      purchaseAccounts.forEach((acc, idx) => {
        console.log(`${idx + 1}. ${acc.name} (${acc._id}) - Path: ${acc.path} - Org: ${acc.organization?.name}`);
      });
    } else {
      console.log('No purchase-related accounts found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugLedgerSystem();