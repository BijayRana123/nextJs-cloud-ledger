import mongoose from 'mongoose';
import ChartOfAccount from '../lib/models/ChartOfAccounts.js';
import dbConnect from '../lib/dbConnect.js';

async function checkAccountNames() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');
    
    // Find accounts with missing or empty names
    const accountsWithIssues = await ChartOfAccount.find({
      $or: [
        { name: { $exists: false } },
        { name: '' },
        { name: null },
        { name: /^[0-9a-f]{24}$/ } // ObjectId pattern
      ]
    });
    
    console.log(`\n🔍 Accounts with name issues: ${accountsWithIssues.length}`);
    accountsWithIssues.forEach(acc => {
      console.log(`- Code: ${acc.code}, Name: '${acc.name}', Path: ${acc.path}`);
    });
    
    // Also check for accounts where name might be an ObjectId
    const allAccounts = await ChartOfAccount.find({}).limit(50);
    console.log('\n📋 First 50 accounts:');
    allAccounts.forEach(acc => {
      const nameIsObjectId = /^[0-9a-f]{24}$/.test(acc.name);
      if (nameIsObjectId) {
        console.log(`⚠️  Account ${acc.code} has ObjectId as name: ${acc.name}`);
      } else {
        console.log(`✅ Account ${acc.code}: ${acc.name}`);
      }
    });
    
    // Check for accounts with very short or suspicious names
    const suspiciousAccounts = await ChartOfAccount.find({
      name: { $regex: /^[a-f0-9]{1,5}$|^[0-9]+$/ }
    });
    
    console.log(`\n🚨 Accounts with suspicious names: ${suspiciousAccounts.length}`);
    suspiciousAccounts.forEach(acc => {
      console.log(`- Code: ${acc.code}, Name: '${acc.name}', Path: ${acc.path}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAccountNames();