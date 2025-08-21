// Fix counter values to prevent duplicate voucher numbers
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixCounterValues() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔧 Fixing Counter Values to Prevent Duplicates...\n');
    
    const orgId = '68146d98ce2735900445a58e'; // Problematic organization
    
    // 1. Find the highest PV number for this organization
    const allPVOrders = await db.collection('purchaseorders').find({
      organization: new ObjectId(orgId),
      referenceNo: { $regex: /^PV-\d+$/ }
    }, { referenceNo: 1 }).toArray();
    
    console.log('📋 Existing PV numbers for this organization:');
    const pvNumbers = [];
    allPVOrders.forEach(po => {
      const match = po.referenceNo.match(/^PV-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        pvNumbers.push(num);
        console.log(`- ${po.referenceNo} (${num})`);
      }
    });
    
    const maxPV = pvNumbers.length > 0 ? Math.max(...pvNumbers) : 0;
    const nextPV = maxPV + 1;
    
    console.log(`\n🔍 Analysis:`);
    console.log(`- Highest PV number used: ${maxPV}`);
    console.log(`- Next PV number should be: ${nextPV}`);
    
    // 2. Find the purchase_voucher counter for this organization
    const purchaseCounter = await db.collection('counters').findOne({
      $and: [
        { organization: new ObjectId(orgId) },
        { $or: [
          { '_id': /purchase/ },
          { 'name': /purchase/ }
        ]}
      ]
    });
    
    if (purchaseCounter) {
      console.log(`\n🔢 Found counter: ${purchaseCounter._id}`);
      console.log(`- Current value: ${purchaseCounter.value || purchaseCounter.seq}`);
      console.log(`- Should be: ${nextPV}`);
      
      if ((purchaseCounter.value || purchaseCounter.seq) < nextPV) {
        console.log('❌ Counter is behind - updating...');
        
        const updateResult = await db.collection('counters').updateOne(
          { _id: purchaseCounter._id },
          { $set: { value: nextPV, seq: nextPV } }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log('✅ Counter updated successfully');
        } else {
          console.log('❌ Failed to update counter');
        }
      } else {
        console.log('✅ Counter is already correct');
      }
    } else {
      console.log('\n❌ No purchase_voucher counter found for this organization');
      
      // Create a new counter
      const newCounterId = new ObjectId();
      const newCounter = {
        _id: newCounterId,
        value: nextPV,
        seq: nextPV,
        organization: new ObjectId(orgId)
      };
      
      const insertResult = await db.collection('counters').insertOne(newCounter);
      if (insertResult.insertedId) {
        console.log('✅ Created new purchase_voucher counter');
        console.log(`- Counter ID: ${newCounterId}`);
        console.log(`- Initial value: ${nextPV}`);
      }
    }
    
    // 3. Also check all organizations for similar issues
    console.log('\n🌐 Checking all organizations for counter issues...');
    
    const allOrgs = await db.collection('organizations').find({}).toArray();
    
    for (const org of allOrgs) {
      const orgPVOrders = await db.collection('purchaseorders').find({
        organization: org._id,
        referenceNo: { $regex: /^PV-\d+$/ }
      }, { referenceNo: 1 }).toArray();
      
      if (orgPVOrders.length > 0) {
        const orgPVNumbers = orgPVOrders
          .map(po => {
            const match = po.referenceNo.match(/^PV-(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0);
          
        const orgMaxPV = Math.max(...orgPVNumbers);
        const orgNextPV = orgMaxPV + 1;
        
        // Find counter for this org
        const orgCounter = await db.collection('counters').findOne({
          $and: [
            { organization: org._id },
            { $or: [
              { '_id': /purchase/ },
              { 'name': /purchase/ }
            ]}
          ]
        });
        
        if (orgCounter && (orgCounter.value || orgCounter.seq) <= orgMaxPV) {
          console.log(`❌ ${org.name}: Counter (${orgCounter.value || orgCounter.seq}) behind max PV (${orgMaxPV})`);
          
          await db.collection('counters').updateOne(
            { _id: orgCounter._id },
            { $set: { value: orgNextPV, seq: orgNextPV } }
          );
          
          console.log(`✅ ${org.name}: Updated counter to ${orgNextPV}`);
        }
      }
    }
    
    console.log('\n✅ Counter fix completed!');
    console.log('💡 You can now create purchase vouchers without duplicate errors.');
    
  } catch (error) {
    console.error('❌ Error fixing counter values:', error);
  } finally {
    await client.close();
  }
}

fixCounterValues();