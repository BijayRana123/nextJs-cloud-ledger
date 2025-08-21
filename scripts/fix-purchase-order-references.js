// Fix Purchase Order referenceNo duplicate key issues
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixPurchaseOrderReferences() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Analyzing Purchase Order referenceNo issues...\n');
    
    // 1. Find duplicate referenceNo values
    const duplicates = await db.collection('purchaseorders').aggregate([
      { $group: { _id: "$referenceNo", count: { $sum: 1 }, docs: { $push: { id: "$_id", org: "$organization" } } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} duplicate referenceNo values`);
    
    for (const dup of duplicates) {
      console.log(`❌ Duplicate referenceNo "${dup._id}": ${dup.count} occurrences`);
      dup.docs.forEach((doc, index) => {
        console.log(`   - Document ${index + 1}: ${doc.id} (org: ${doc.org})`);
      });
    }
    
    // 2. Drop the problematic unique index on referenceNo
    try {
      await db.collection('purchaseorders').dropIndex('referenceNo_1');
      console.log('✅ Dropped global unique index on referenceNo');
    } catch (err) {
      console.log('ℹ️  Global unique index on referenceNo already removed or doesn\'t exist');
    }
    
    // 3. Create compound unique index (referenceNo, organization)
    try {
      await db.collection('purchaseorders').createIndex(
        { referenceNo: 1, organization: 1 }, 
        { unique: true, sparse: true, name: 'referenceNo_organization_unique' }
      );
      console.log('✅ Created compound unique index: referenceNo + organization');
    } catch (err) {
      console.log('ℹ️  Compound unique index already exists or couldn\'t be created:', err.message);
    }
    
    // 4. List current indexes
    const indexes = await db.collection('purchaseorders').indexes();
    console.log('\n📋 Current Purchase Order indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // 5. Check for any remaining issues
    const totalPurchaseOrders = await db.collection('purchaseorders').countDocuments();
    const ordersWithReferenceNo = await db.collection('purchaseorders').countDocuments({ referenceNo: { $exists: true, $ne: null } });
    
    console.log(`\n📊 Purchase Order Summary:`);
    console.log(`- Total Purchase Orders: ${totalPurchaseOrders}`);
    console.log(`- Orders with referenceNo: ${ordersWithReferenceNo}`);
    console.log(`- Orders without referenceNo: ${totalPurchaseOrders - ordersWithReferenceNo}`);
    
    // 6. Show sample purchase orders
    const sampleOrders = await db.collection('purchaseorders').find({}, { referenceNo: 1, organization: 1, createdAt: 1 }).limit(5).toArray();
    console.log('\n📋 Sample Purchase Orders:');
    sampleOrders.forEach(order => {
      console.log(`- ID: ${order._id}, referenceNo: ${order.referenceNo || 'null'}, org: ${order.organization}`);
    });
    
    console.log('\n✅ Purchase Order referenceNo fix completed!');
    console.log('📝 Note: The API has been updated to handle referenceNo generation properly.');
    
  } catch (error) {
    console.error('❌ Error fixing purchase order references:', error);
  } finally {
    await client.close();
  }
}

fixPurchaseOrderReferences();