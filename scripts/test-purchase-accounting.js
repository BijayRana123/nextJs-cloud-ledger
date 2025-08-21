// Test purchase accounting entry creation
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import dbConnect from '../lib/dbConnect.js';
import { createPurchaseEntry } from '../lib/accounting.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testPurchaseAccounting() {
  try {
    await dbConnect();
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('🧪 Testing Purchase Accounting Entry Creation...\n');
    
    // Get a recent purchase order to test with
    const recentPO = await db.collection('purchaseorders').findOne({}, { sort: { createdAt: -1 } });
    
    if (!recentPO) {
      console.log('❌ No purchase orders found to test with');
      return;
    }
    
    console.log('📋 Testing with Purchase Order:');
    console.log(`- ID: ${recentPO._id}`);
    console.log(`- Reference: ${recentPO.referenceNo}`);
    console.log(`- Total: ${recentPO.totalAmount}`);
    console.log(`- Supplier: ${recentPO.supplier}`);
    console.log(`- Organization: ${recentPO.organization}`);
    console.log(`- Items: ${recentPO.items?.length || 0}`);
    
    // Get organization name
    const org = await db.collection('organizations').findOne({ _id: new ObjectId(recentPO.organization) });
    if (!org) {
      console.log('❌ Organization not found');
      return;
    }
    
    console.log(`- Organization Name: ${org.name}\n`);
    
    // Test the createPurchaseEntry function
    console.log('🔧 Calling createPurchaseEntry...');
    
    try {
      const voucherNumber = await createPurchaseEntry(recentPO, recentPO.organization, org.name);
      console.log(`✅ Purchase entry created successfully!`);
      console.log(`- Generated voucher number: ${voucherNumber}`);
      
      // Check if journal entry was created
      const journalEntry = await db.collection('medici_journals').findOne({ voucherNumber });
      if (journalEntry) {
        console.log('✅ Journal entry found in database');
        console.log(`- Journal ID: ${journalEntry._id}`);
        console.log(`- Memo: ${journalEntry.memo}`);
        
        // Check transactions
        const transactions = await db.collection('medici_transactions').find({ voucherNumber }).toArray();
        console.log(`✅ Found ${transactions.length} transactions:`);
        
        transactions.forEach((tx, index) => {
          console.log(`  ${index + 1}. Account: ${tx.account}`);
          console.log(`     ${tx.debit || 0} DR / ${tx.credit || 0} CR`);
        });
      } else {
        console.log('❌ Journal entry not found in database');
      }
      
    } catch (error) {
      console.error('❌ Error creating purchase entry:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      // Let's test the individual components
      console.log('\n🔍 Testing individual components...');
      
      // Test supplier resolution
      try {
        const supplier = await db.collection('suppliers').findOne({ _id: new ObjectId(recentPO.supplier) });
        if (supplier) {
          console.log(`✅ Supplier found: ${supplier.name}`);
        } else {
          console.log(`❌ Supplier not found: ${recentPO.supplier}`);
        }
      } catch (supplierError) {
        console.log(`❌ Error finding supplier: ${supplierError.message}`);
      }
      
      // Test items resolution
      if (recentPO.items && recentPO.items.length > 0) {
        console.log(`🔍 Testing ${recentPO.items.length} items:`);
        for (let i = 0; i < recentPO.items.length; i++) {
          const item = recentPO.items[i];
          try {
            const itemDoc = await db.collection('items').findOne({ _id: new ObjectId(item.item) });
            if (itemDoc) {
              console.log(`  ✅ Item ${i + 1}: ${itemDoc.name} (Qty: ${item.quantity}, Price: ${item.price})`);
            } else {
              console.log(`  ❌ Item ${i + 1} not found: ${item.item}`);
            }
          } catch (itemError) {
            console.log(`  ❌ Error finding item ${i + 1}: ${itemError.message}`);
          }
        }
      }
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPurchaseAccounting();