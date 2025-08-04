import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugOrganizationAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orgId = '6808be0ebc40b10d2807ab41';
    
    // Check all accounts for the organization
    const accounts = await ChartOfAccount.find({
      organization: new mongoose.Types.ObjectId(orgId)
    }).sort({ code: 1 });
    
    console.log(`\n📊 Found ${accounts.length} accounts for organization ${orgId}`);
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found for this organization!');
      
      // Check if there are any accounts without organization
      const orphanAccounts = await ChartOfAccount.find({
        organization: { $exists: false }
      });
      
      console.log(`\n🔍 Found ${orphanAccounts.length} orphan accounts (no organization)`);
      
      if (orphanAccounts.length > 0) {
        console.log('\n📋 Orphan accounts:');
        orphanAccounts.forEach((acc, index) => {
          console.log(`${index + 1}. Code: "${acc.code}" | Name: "${acc.name}" | Path: "${acc.path}"`);
        });
        
        console.log('\n🔧 Would you like to assign these accounts to your organization?');
      }
      
      return;
    }
    
    console.log('\n🔍 Account Code Analysis:');
    console.log('='.repeat(80));
    
    let problematicAccounts = [];
    
    accounts.forEach((acc, index) => {
      console.log(`${index + 1}. Code: "${acc.code}" | Name: "${acc.name}" | Type: ${acc.type}`);
      console.log(`   Path: "${acc.path}"`);
      
      // Check if code looks like a path instead of a code
      if (acc.code && (acc.code.includes(':') || acc.code.includes(' ') || acc.code.length > 10)) {
        console.log(`   ⚠️  WARNING: Code looks like a path/name instead of numeric code!`);
        problematicAccounts.push(acc);
      } else {
        console.log(`   ✅ Code looks proper`);
      }
      
      console.log('');
    });

    if (problematicAccounts.length > 0) {
      console.log(`\n❌ Found ${problematicAccounts.length} accounts with problematic codes:`);
      problematicAccounts.forEach(acc => {
        console.log(`   - "${acc.code}" (${acc.name})`);
      });
    }

    // Check accounts that have transactions
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');
    
    const transactionPaths = await transactionCollection.distinct('accounts', {
      organizationId: new mongoose.Types.ObjectId(orgId)
    });
    
    console.log(`\n💰 Found ${transactionPaths.length} unique account paths in transactions:`);
    transactionPaths.forEach(path => console.log(`  - "${path}"`));
    
    // Check which accounts have transactions
    console.log('\n🔍 Accounts with transactions:');
    for (const account of accounts) {
      const txnCount = await transactionCollection.countDocuments({
        accounts: account.path,
        organizationId: new mongoose.Types.ObjectId(orgId)
      });
      
      if (txnCount > 0) {
        console.log(`✅ ${account.code} - ${account.name} (${txnCount} transactions)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugOrganizationAccounts();