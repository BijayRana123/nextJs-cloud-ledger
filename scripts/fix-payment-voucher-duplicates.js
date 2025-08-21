/**
 * Diagnostic and Fix Script for Payment Voucher Duplicate Key Issues
 * 
 * This script helps diagnose and fix issues with payment voucher numbering
 * that can cause E11000 duplicate key errors.
 */

import mongoose from 'mongoose';
import PaymentVoucher from '../lib/models/PaymentVoucher.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function diagnosePaymentVouchers() {
  console.log('\n🔍 DIAGNOSING PAYMENT VOUCHER ISSUES...\n');

  // 1. Check for duplicate payment voucher numbers
  console.log('1. Checking for duplicate payment voucher numbers...');
  const duplicates = await PaymentVoucher.aggregate([
    {
      $group: {
        _id: { paymentVoucherNumber: '$paymentVoucherNumber', organization: '$organization' },
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', date: '$date' } }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);

  if (duplicates.length > 0) {
    console.log('❌ Found duplicate payment voucher numbers:');
    duplicates.forEach(dup => {
      console.log(`   - ${dup._id.paymentVoucherNumber} (Org: ${dup._id.organization}) - ${dup.count} duplicates`);
      dup.docs.forEach(doc => {
        console.log(`     * ID: ${doc.id}, Date: ${doc.date}`);
      });
    });
  } else {
    console.log('✅ No duplicate payment voucher numbers found');
  }

  // 2. Check for payment vouchers without numbers
  console.log('\n2. Checking for payment vouchers without numbers...');
  const withoutNumbers = await PaymentVoucher.find({
    $or: [
      { paymentVoucherNumber: { $exists: false } },
      { paymentVoucherNumber: null },
      { paymentVoucherNumber: '' }
    ]
  });

  if (withoutNumbers.length > 0) {
    console.log(`❌ Found ${withoutNumbers.length} payment vouchers without numbers`);
    withoutNumbers.forEach(voucher => {
      console.log(`   - ID: ${voucher._id}, Org: ${voucher.organization}, Date: ${voucher.date}`);
    });
  } else {
    console.log('✅ All payment vouchers have numbers');
  }

  // 3. Check counter states
  console.log('\n3. Checking counter states...');
  const counters = await Counter.find({ name: 'payment_voucher' });
  
  if (counters.length === 0) {
    console.log('⚠️  No payment voucher counters found');
  } else {
    console.log(`Found ${counters.length} payment voucher counter(s):`);
    for (const counter of counters) {
      console.log(`   - Organization: ${counter.organization}, Value: ${counter.value}`);
      
      // Check if organization is a name or ID
      const isObjectId = mongoose.Types.ObjectId.isValid(counter.organization);
      if (isObjectId) {
        const org = await Organization.findById(counter.organization);
        console.log(`     * Organization ID: ${counter.organization} (${org ? org.name : 'NOT FOUND'})`);
      } else {
        console.log(`     * Organization Name: ${counter.organization}`);
        // Try to find organization by name
        const org = await Organization.findOne({ name: counter.organization });
        if (org) {
          console.log(`     * Corresponding Organization ID: ${org._id}`);
        } else {
          console.log(`     * ❌ No organization found with name: ${counter.organization}`);
        }
      }
    }
  }

  // 4. Check highest payment voucher numbers per organization
  console.log('\n4. Checking highest payment voucher numbers per organization...');
  const highestNumbers = await PaymentVoucher.aggregate([
    {
      $match: {
        paymentVoucherNumber: { $exists: true, $ne: null, $ne: '' }
      }
    },
    {
      $addFields: {
        voucherNumber: {
          $toInt: {
            $substr: [
              { $replaceAll: { input: '$paymentVoucherNumber', find: 'PaV-', replacement: '' } },
              0,
              -1
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: '$organization',
        maxNumber: { $max: '$voucherNumber' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (highestNumbers.length > 0) {
    console.log('Highest payment voucher numbers by organization:');
    for (const item of highestNumbers) {
      const org = await Organization.findById(item._id);
      console.log(`   - Org: ${org ? org.name : 'Unknown'} (${item._id})`);
      console.log(`     * Highest Number: PaV-${item.maxNumber.toString().padStart(5, '0')}`);
      console.log(`     * Total Vouchers: ${item.count}`);
    }
  } else {
    console.log('No payment vouchers with valid numbers found');
  }

  return { duplicates, withoutNumbers, counters, highestNumbers };
}

async function fixPaymentVoucherIssues() {
  console.log('\n🔧 FIXING PAYMENT VOUCHER ISSUES...\n');

  // Step 0: Ensure correct indexes on collection (drop legacy global unique index)
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('paymentvouchers');

    // Show current indexes
    const indexes = await collection.indexes();
    console.log('\n=== CURRENT INDEXES (paymentvouchers) ===');
    indexes.forEach(idx => console.log(`${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`));

    // Drop any legacy global unique index on paymentVoucherNumber
    try {
      await collection.dropIndex('paymentVoucherNumber_1');
      console.log('✅ Dropped legacy global unique index paymentVoucherNumber_1');
    } catch (err) {
      if (err?.message?.includes('index not found')) {
        console.log('ℹ️  Legacy index paymentVoucherNumber_1 not found (already dropped)');
      } else {
        console.log('⚠️  Could not drop paymentVoucherNumber_1:', err.message);
      }
    }

    // Ensure compound unique index exists
    const updatedIdx = await collection.indexes();
    const hasCompound = updatedIdx.some(i => i.name === 'paymentVoucherNumber_1_organization_1' && i.unique);
    if (!hasCompound) {
      console.log('Creating compound unique index (paymentVoucherNumber, organization)...');
      await collection.createIndex({ paymentVoucherNumber: 1, organization: 1 }, { unique: true, sparse: true, background: true, name: 'paymentVoucherNumber_1_organization_1' });
      console.log('✅ Created compound unique index (paymentVoucherNumber, organization)');
    } else {
      console.log('✅ Compound unique index already present');
    }
  } catch (idxErr) {
    console.log('⚠️  Index preparation step failed:', idxErr.message);
  }

  const diagnosis = await diagnosePaymentVouchers();

  // Fix 1: Remove duplicate payment vouchers (keep the oldest one)
  if (diagnosis.duplicates.length > 0) {
    console.log('1. Removing duplicate payment vouchers...');
    for (const dup of diagnosis.duplicates) {
      // Sort by date and keep the oldest one
      const sortedDocs = dup.docs.sort((a, b) => new Date(a.date) - new Date(b.date));
      const toKeep = sortedDocs[0];
      const toRemove = sortedDocs.slice(1);

      console.log(`   - Keeping voucher ${toKeep.id} (${toKeep.date})`);
      for (const doc of toRemove) {
        console.log(`   - Removing voucher ${doc.id} (${doc.date})`);
        await PaymentVoucher.findByIdAndDelete(doc.id);
      }
    }
    console.log('✅ Duplicate payment vouchers removed');
  }

  // Fix 2: Update counters to use organization IDs instead of names
  console.log('\n2. Updating counters to use organization IDs...');
  const nameBasedCounters = diagnosis.counters.filter(c => !mongoose.Types.ObjectId.isValid(c.organization));
  
  for (const counter of nameBasedCounters) {
    console.log(`   - Processing counter for organization name: ${counter.organization}`);
    
    // Find organization by name
    const org = await Organization.findOne({ name: counter.organization });
    if (org) {
      // Check if there's already a counter for this organization ID
      const existingCounter = await Counter.findOne({ 
        name: 'payment_voucher', 
        organization: org._id.toString() 
      });

      if (existingCounter) {
        console.log(`     * Counter already exists for org ID ${org._id}, merging...`);
        // Keep the higher value
        if (counter.value > existingCounter.value) {
          existingCounter.value = counter.value;
          await existingCounter.save();
          console.log(`     * Updated existing counter to value ${counter.value}`);
        }
        // Remove the name-based counter
        await Counter.findByIdAndDelete(counter._id);
        console.log(`     * Removed name-based counter`);
      } else {
        // Update the counter to use organization ID
        counter.organization = org._id.toString();
        await counter.save();
        console.log(`     * Updated counter to use organization ID: ${org._id}`);
      }
    } else {
      console.log(`     * ❌ Organization not found for name: ${counter.organization}`);
      console.log(`     * Removing orphaned counter`);
      await Counter.findByIdAndDelete(counter._id);
    }
  }

  // Fix 3: Sync counters with actual highest voucher numbers
  console.log('\n3. Syncing counters with actual voucher numbers...');
  for (const item of diagnosis.highestNumbers) {
    const counter = await Counter.findOne({ 
      name: 'payment_voucher', 
      organization: item._id.toString() 
    });

    if (counter) {
      if (counter.value < item.maxNumber) {
        console.log(`   - Updating counter for org ${item._id} from ${counter.value} to ${item.maxNumber}`);
        counter.value = item.maxNumber;
        await counter.save();
      } else {
        console.log(`   - Counter for org ${item._id} is already correct (${counter.value})`);
      }
    } else {
      console.log(`   - Creating new counter for org ${item._id} with value ${item.maxNumber}`);
      await Counter.create({
        name: 'payment_voucher',
        organization: item._id.toString(),
        value: item.maxNumber
      });
    }
  }

  console.log('\n✅ Payment voucher issues fixed!');
}

async function main() {
  await connectDB();

  const args = process.argv.slice(2);
  const command = args[0] || 'diagnose';

  try {
    switch (command) {
      case 'diagnose':
        await diagnosePaymentVouchers();
        break;
      case 'fix':
        await fixPaymentVoucherIssues();
        break;
      case 'both':
        await diagnosePaymentVouchers();
        console.log('\n' + '='.repeat(60));
        await fixPaymentVoucherIssues();
        break;
      default:
        console.log('Usage: node fix-payment-voucher-duplicates.js [diagnose|fix|both]');
        console.log('  diagnose - Only check for issues (default)');
        console.log('  fix      - Fix the issues');
        console.log('  both     - Diagnose and then fix');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
main().catch(console.error);