// Debug voucher number generation
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugVoucherNumbers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    const orgId = '68146d98ce2735900445a58e'; // From your error
    
    console.log('🔍 Debugging Voucher Numbers for Organization:', orgId);
    console.log('');
    
    // Check existing purchase orders for this organization
    console.log('📋 Existing Purchase Orders for this organization:');
    const existingPOs = await db.collection('purchaseorders').find({
      organization: new ObjectId(orgId)
    }).sort({ createdAt: -1 }).toArray();
    
    existingPOs.forEach((po, index) => {
      console.log(`${index + 1}. ID: ${po._id}, RefNo: ${po.referenceNo || 'NULL'}, Total: ${po.totalAmount}, Date: ${po.createdAt || po.date}`);
    });
    
    console.log('\n🔢 Counter Documents:');
    const counters = await db.collection('counters').find({}).toArray();
    counters.forEach(counter => {
      console.log(`- Name: ${counter._id || counter.name}, Value: ${counter.value || counter.seq}, Org: ${counter.organization || 'Global'}`);
    });
    
    console.log('\n🔍 Looking for PV-0003 conflicts:');
    const pv003Conflicts = await db.collection('purchaseorders').find({
      referenceNo: 'PV-0003'
    }).toArray();
    
    if (pv003Conflicts.length > 0) {
      console.log('❌ Found PV-0003 conflicts:');
      pv003Conflicts.forEach(po => {
        console.log(`- PO ${po._id}: Org ${po.organization}, Created: ${po.createdAt}`);
      });
    } else {
      console.log('✅ No existing PV-0003 found');
    }
    
    // Check journal entries with PV-0003
    console.log('\n📋 Journal entries with PV-0003:');
    const journalPV003 = await db.collection('medici_journals').find({
      voucherNumber: 'PV-0003'
    }).toArray();
    
    if (journalPV003.length > 0) {
      console.log('Found journal entries:');
      journalPV003.forEach(journal => {
        console.log(`- Journal ${journal._id}: ${journal.memo}, Org: ${journal.organizationId}`);
      });
    } else {
      console.log('No journal entries found with PV-0003');
    }
    
    // Check if there are purchase_voucher counters
    console.log('\n🔢 Purchase Voucher Counters:');
    const purchaseCounters = await db.collection('counters').find({
      $or: [
        { '_id': /purchase/ },
        { 'name': /purchase/ }
      ]
    }).toArray();
    
    if (purchaseCounters.length > 0) {
      purchaseCounters.forEach(counter => {
        console.log(`- ${counter._id}: Value ${counter.value || counter.seq}, Org: ${counter.organization}`);
      });
    } else {
      console.log('No purchase voucher counters found');
    }
    
    // Suggest next available voucher number
    const allPVNumbers = await db.collection('purchaseorders').find({
      organization: new ObjectId(orgId),
      referenceNo: { $regex: /^PV-\d+$/ }
    }, { referenceNo: 1 }).toArray();
    
    const pvNumbers = allPVNumbers
      .map(po => parseInt(po.referenceNo?.replace('PV-', '') || 0))
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);
    
    const nextNumber = pvNumbers.length > 0 ? pvNumbers[0] + 1 : 1;
    console.log(`\n💡 Suggested next PV number: PV-${nextNumber.toString().padStart(4, '0')}`);
    
  } catch (error) {
    console.error('❌ Error debugging voucher numbers:', error);
  } finally {
    await client.close();
  }
}

debugVoucherNumbers();