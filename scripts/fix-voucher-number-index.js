import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

async function fixVoucherNumberIndex() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get the collection directly to manage indexes
    const collection = mongoose.connection.db.collection('salesvoucher2');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('\n=== CURRENT INDEXES ===');
    indexes.forEach(index => {
      console.log(`Index: ${JSON.stringify(index.key)} - Unique: ${index.unique || false}`);
    });

    // Drop the global unique index on salesVoucherNumber if it exists
    try {
      await collection.dropIndex('salesVoucherNumber_1');
      console.log('✅ Dropped global unique index on salesVoucherNumber');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  Global unique index on salesVoucherNumber not found (already dropped)');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Create the compound unique index (this should be handled by the schema, but let's ensure it)
    try {
      await collection.createIndex(
        { salesVoucherNumber: 1, organization: 1 }, 
        { unique: true, sparse: true, name: 'salesVoucherNumber_organization_unique' }
      );
      console.log('✅ Created compound unique index on (salesVoucherNumber, organization)');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Compound unique index already exists');
      } else {
        console.log('⚠️  Error creating compound index:', error.message);
      }
    }

    // List indexes after changes
    const newIndexes = await collection.indexes();
    console.log('\n=== UPDATED INDEXES ===');
    newIndexes.forEach(index => {
      console.log(`Index: ${JSON.stringify(index.key)} - Unique: ${index.unique || false}`);
    });

    // Fix the counter for "zs construction" organization
    console.log('\n=== FIXING ZS CONSTRUCTION COUNTER ===');
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (zsOrg) {
      const orgId = zsOrg._id.toString();
      console.log(`Found zs construction org: ${orgId}`);

      // Check existing vouchers for this org
      const existingVouchers = await SalesVoucher2.find({
        organization: orgId,
        salesVoucherNumber: { $exists: true, $ne: null, $regex: /^SV-\d+$/ }
      }).select('salesVoucherNumber');

      console.log(`Existing vouchers with numbers: ${existingVouchers.length}`);
      existingVouchers.forEach(v => console.log(`  ${v.salesVoucherNumber}`));

      // Reset counter to 1 since there are no existing vouchers with proper numbers
      const result = await Counter.findOneAndUpdate(
        { name: 'sales_voucher', organization: orgId },
        { 
          value: 1,
          prefix: 'SV-',
          paddingSize: 4
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Reset zs construction counter to: ${result.value} (next voucher: SV-0001)`);
    } else {
      console.log('⚠️  zs construction organization not found');
    }

    // Clean up the undefined vouchers for zs construction
    console.log('\n=== CLEANING UP UNDEFINED VOUCHERS ===');
    if (zsOrg) {
      const undefinedVouchers = await SalesVoucher2.find({
        organization: zsOrg._id,
        $or: [
          { salesVoucherNumber: { $exists: false } },
          { salesVoucherNumber: null },
          { salesVoucherNumber: '' }
        ]
      });

      console.log(`Found ${undefinedVouchers.length} undefined vouchers for zs construction`);
      
      if (undefinedVouchers.length > 0) {
        // Delete these failed vouchers
        const deleteResult = await SalesVoucher2.deleteMany({
          organization: zsOrg._id,
          $or: [
            { salesVoucherNumber: { $exists: false } },
            { salesVoucherNumber: null },
            { salesVoucherNumber: '' }
          ]
        });
        console.log(`✅ Deleted ${deleteResult.deletedCount} undefined vouchers`);
      }
    }

    console.log('\n✅ Voucher number index fix completed');

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the fix
fixVoucherNumberIndex();