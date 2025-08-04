import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';

async function fixAccountNamesWithObjectIds() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');
    
    // Get the collections directly
    const db = mongoose.connection.db;
    const chartOfAccountsCollection = db.collection('chartofaccounts');
    const customersCollection = db.collection('customers');
    const itemsCollection = db.collection('items');
    
    // Find accounts with ObjectId names
    const accountsWithObjectIdNames = await chartOfAccountsCollection.find({
      name: /^[0-9a-f]{24}$/
    }).toArray();
    
    console.log(`\n🔍 Found ${accountsWithObjectIdNames.length} accounts with ObjectId names`);
    
    let fixedCount = 0;
    
    for (const account of accountsWithObjectIdNames) {
      console.log(`\n🔧 Processing account ${account.code}: ${account.name}`);
      console.log(`   Path: ${account.path}`);
      
      let newName = null;
      
      // Check if it's a customer account (Accounts Receivable)
      if (account.path.includes('Accounts Receivable')) {
        try {
          const customer = await customersCollection.findOne({ 
            _id: new mongoose.Types.ObjectId(account.name) 
          });
          if (customer) {
            newName = customer.name;
            console.log(`   ✅ Found customer: ${newName}`);
          } else {
            console.log(`   ❌ Customer not found for ID: ${account.name}`);
            // Set a default name
            newName = `Customer ${account.code}`;
          }
        } catch (error) {
          console.log(`   ❌ Error looking up customer: ${error.message}`);
          newName = `Customer ${account.code}`;
        }
      }
      
      // Check if it's an inventory account
      else if (account.path.includes('Inventory')) {
        try {
          const item = await itemsCollection.findOne({ 
            _id: new mongoose.Types.ObjectId(account.name) 
          });
          if (item) {
            newName = item.name;
            console.log(`   ✅ Found item: ${newName}`);
          } else {
            console.log(`   ❌ Item not found for ID: ${account.name}`);
            // Set a default name
            newName = `Item ${account.code}`;
          }
        } catch (error) {
          console.log(`   ❌ Error looking up item: ${error.message}`);
          newName = `Item ${account.code}`;
        }
      }
      
      // If we couldn't determine the type, set a generic name
      else {
        newName = `Account ${account.code}`;
        console.log(`   ⚠️  Unknown account type, using generic name`);
      }
      
      // Update the account name
      if (newName) {
        await chartOfAccountsCollection.updateOne(
          { _id: account._id },
          { 
            $set: { 
              name: newName,
              updatedAt: new Date()
            }
          }
        );
        console.log(`   ✅ Updated name to: ${newName}`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} account names`);
    
    // Verify the fixes
    const remainingIssues = await chartOfAccountsCollection.find({
      name: /^[0-9a-f]{24}$/
    }).toArray();
    
    console.log(`\n✅ Remaining accounts with ObjectId names: ${remainingIssues.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAccountNamesWithObjectIds();