import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkAllAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check all Chart of Accounts
    const allAccounts = await ChartOfAccount.find({});
    console.log(`\n📊 Total Chart of Accounts in system: ${allAccounts.length}`);
    
    if (allAccounts.length > 0) {
      console.log('\n🏢 Accounts by Organization:');
      const accountsByOrg = {};
      allAccounts.forEach(acc => {
        const orgId = acc.organization?.toString() || 'No Organization';
        if (!accountsByOrg[orgId]) {
          accountsByOrg[orgId] = [];
        }
        accountsByOrg[orgId].push(acc);
      });
      
      Object.keys(accountsByOrg).forEach(orgId => {
        console.log(`\nOrganization ${orgId}: ${accountsByOrg[orgId].length} accounts`);
        accountsByOrg[orgId].slice(0, 5).forEach(acc => {
          console.log(`  - ${acc.code}: ${acc.name} (${acc.type}) - Path: ${acc.path}`);
        });
        if (accountsByOrg[orgId].length > 5) {
          console.log(`  ... and ${accountsByOrg[orgId].length - 5} more`);
        }
      });
    }

    // Check what account paths are being used in transactions
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const accountPaths = await transactionCollection.distinct('accounts', {
      organizationId: new mongoose.Types.ObjectId('6808baf5f691bbb5e9fd1d5b')
    });
    
    console.log(`\n💰 Unique account paths in transactions: ${accountPaths.length}`);
    accountPaths.slice(0, 10).forEach(path => console.log(`  - ${path}`));
    if (accountPaths.length > 10) {
      console.log(`  ... and ${accountPaths.length - 10} more`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAllAccounts();