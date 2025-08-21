import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

async function verifyFix() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Check indexes
    const collection = mongoose.connection.db.collection('salesvoucher2');
    const indexes = await collection.indexes();
    console.log('\n=== CURRENT INDEXES ===');
    indexes.forEach(index => {
      console.log(`Index: ${JSON.stringify(index.key)} - Unique: ${index.unique || false} - Sparse: ${index.sparse || false}`);
    });

    // Check counters
    const counters = await Counter.find({ name: 'sales_voucher' }).sort({ organization: 1 });
    console.log('\n=== SALES VOUCHER COUNTERS ===');
    for (const counter of counters) {
      const org = await Organization.findById(counter.organization).select('name');
      console.log(`${org?.name || 'Unknown'} (${counter.organization}): Value ${counter.value} - Next: SV-${counter.value.toString().padStart(4, '0')}`);
    }

    // Check for any recent vouchers with duplicate numbers across organizations
    console.log('\n=== CHECKING FOR CROSS-ORGANIZATION DUPLICATES ===');
    const duplicateCheck = await SalesVoucher2.aggregate([
      {
        $match: {
          salesVoucherNumber: { $exists: true, $ne: null, $regex: /^SV-\d+$/ }
        }
      },
      {
        $group: {
          _id: "$salesVoucherNumber",
          count: { $sum: 1 },
          organizations: { $addToSet: "$organization" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateCheck.length > 0) {
      console.log('❌ Found cross-organization duplicates:');
      for (const dup of duplicateCheck) {
        console.log(`  ${dup._id}: ${dup.count} vouchers across ${dup.organizations.length} organizations`);
        for (const orgId of dup.organizations) {
          const org = await Organization.findById(orgId).select('name');
          console.log(`    - ${org?.name || 'Unknown'} (${orgId})`);
        }
      }
    } else {
      console.log('✅ No cross-organization duplicates found');
    }

    // Test the voucher number generation logic
    console.log('\n=== TESTING VOUCHER NUMBER GENERATION ===');
    const testOrgs = ['manakamana', 'zs construction'];
    
    for (const orgName of testOrgs) {
      const org = await Organization.findOne({ name: orgName });
      if (org) {
        const counter = await Counter.findOne({
          name: 'sales_voucher',
          organization: org._id.toString()
        });
        
        if (counter) {
          const nextVoucherNumber = `SV-${counter.value.toString().padStart(4, '0')}`;
          console.log(`${orgName}: Next voucher would be ${nextVoucherNumber}`);
          
          // Check if this number already exists for this organization
          const existing = await SalesVoucher2.findOne({
            salesVoucherNumber: nextVoucherNumber,
            organization: org._id
          });
          
          if (existing) {
            console.log(`  ❌ ${nextVoucherNumber} already exists for ${orgName}!`);
          } else {
            console.log(`  ✅ ${nextVoucherNumber} is available for ${orgName}`);
          }
        } else {
          console.log(`${orgName}: No counter found`);
        }
      }
    }

    console.log('\n✅ Verification completed');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the verification
verifyFix();