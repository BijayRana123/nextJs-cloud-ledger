import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function fixReceiptVoucherIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('receiptvouchers');

    // Check current indexes
    console.log('\n=== CURRENT INDEXES ===');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    // Drop the global unique index on receiptVoucherNumber
    console.log('\n=== DROPPING GLOBAL UNIQUE INDEX ===');
    try {
      await collection.dropIndex('receiptVoucherNumber_1');
      console.log('✅ Successfully dropped receiptVoucherNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index receiptVoucherNumber_1 does not exist (already dropped)');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Verify the compound unique index exists
    console.log('\n=== VERIFYING COMPOUND UNIQUE INDEX ===');
    const updatedIndexes = await collection.indexes();
    const compoundIndex = updatedIndexes.find(idx => idx.name === 'receiptVoucherNumber_1_organization_1');
    
    if (compoundIndex && compoundIndex.unique) {
      console.log('✅ Compound unique index exists and is unique');
      console.log(`   Key: ${JSON.stringify(compoundIndex.key)}`);
    } else {
      console.log('❌ Compound unique index missing or not unique');
      
      // Create the compound unique index if it doesn't exist
      console.log('Creating compound unique index...');
      await collection.createIndex(
        { receiptVoucherNumber: 1, organization: 1 },
        { unique: true, background: true, sparse: true }
      );
      console.log('✅ Created compound unique index');
    }

    // Final verification
    console.log('\n=== FINAL INDEX STATE ===');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('\n✅ Receipt voucher indexes fixed successfully!');
    console.log('Now receipt voucher numbers will be unique per organization, not globally.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixReceiptVoucherIndexes();