import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ReceiptVoucher from '../lib/models/ReceiptVoucher.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

dotenv.config({ path: '.env.local' });

async function debugReceiptVoucherIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Check for RcV-00004 specifically
    console.log('\n=== CHECKING FOR RcV-00004 ===');
    const rcv00004 = await ReceiptVoucher.find({ receiptVoucherNumber: 'RcV-00004' })
      .populate('organization', 'name');
    
    if (rcv00004.length > 0) {
      console.log(`Found ${rcv00004.length} voucher(s) with number RcV-00004:`);
      for (const voucher of rcv00004) {
        console.log(`- ID: ${voucher._id}, Org: ${voucher.organization?.name || 'Unknown'} (${voucher.organization?._id}), Amount: ${voucher.amount}, Date: ${voucher.date?.toISOString()}`);
      }
    } else {
      console.log('No vouchers found with number RcV-00004.');
    }

    // Check all organizations and their counters
    console.log('\n=== ALL ORGANIZATIONS AND THEIR COUNTERS ===');
    const organizations = await Organization.find().select('name');
    
    for (const org of organizations) {
      console.log(`\nOrganization: ${org.name} (${org._id})`);
      
      // Find counter for this organization
      const counter = await Counter.findOne({ 
        name: 'receipt_voucher', 
        organization: org._id.toString() 
      });
      
      if (counter) {
        console.log(`  Counter value: ${counter.value} (Next: RcV-${(counter.value + 1).toString().padStart(5, '0')})`);
      } else {
        console.log(`  No counter found`);
      }
      
      // Find recent vouchers for this organization
      const recentVouchers = await ReceiptVoucher.find({ organization: org._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('receiptVoucherNumber amount date');
      
      if (recentVouchers.length > 0) {
        console.log(`  Recent vouchers:`);
        for (const voucher of recentVouchers) {
          console.log(`    ${voucher.receiptVoucherNumber} - Amount: ${voucher.amount} - Date: ${voucher.date?.toISOString()}`);
        }
      } else {
        console.log(`  No vouchers found`);
      }
    }

    // Check for any vouchers without proper organization reference
    console.log('\n=== CHECKING FOR ORPHANED VOUCHERS ===');
    const allVouchers = await ReceiptVoucher.find().populate('organization', 'name');
    const orphanedVouchers = allVouchers.filter(v => !v.organization);
    
    if (orphanedVouchers.length > 0) {
      console.log(`Found ${orphanedVouchers.length} orphaned vouchers:`);
      for (const voucher of orphanedVouchers) {
        console.log(`- ${voucher.receiptVoucherNumber} (ID: ${voucher._id}) - Org field: ${voucher.organization}`);
      }
    } else {
      console.log('No orphaned vouchers found.');
    }

    // Check the unique index
    console.log('\n=== CHECKING UNIQUE INDEX ===');
    const db = mongoose.connection.db;
    const indexes = await db.collection('receiptvouchers').indexes();
    const uniqueIndex = indexes.find(idx => idx.name === 'receiptVoucherNumber_1_organization_1');
    
    if (uniqueIndex) {
      console.log('Unique index found:', JSON.stringify(uniqueIndex, null, 2));
    } else {
      console.log('Unique index not found. Available indexes:');
      indexes.forEach(idx => console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugReceiptVoucherIssue();