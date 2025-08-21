import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';

async function checkCompoundIndex() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get the collection directly
    const collection = mongoose.connection.db.collection('salesvoucher2');

    // List all indexes with full details
    const indexes = await collection.indexes();
    console.log('\n=== ALL INDEXES (DETAILED) ===');
    indexes.forEach((index, i) => {
      console.log(`\nIndex ${i + 1}:`);
      console.log(`  Name: ${index.name}`);
      console.log(`  Key: ${JSON.stringify(index.key)}`);
      console.log(`  Unique: ${index.unique || false}`);
      console.log(`  Sparse: ${index.sparse || false}`);
      if (index.partialFilterExpression) {
        console.log(`  Partial Filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    // Try to create the compound index if it doesn't exist
    const hasCompoundIndex = indexes.some(index => 
      index.key.salesVoucherNumber === 1 && index.key.organization === 1
    );

    if (!hasCompoundIndex) {
      console.log('\n❌ Compound index not found, creating it...');
      try {
        await collection.createIndex(
          { salesVoucherNumber: 1, organization: 1 }, 
          { 
            unique: true, 
            sparse: true, 
            name: 'salesVoucherNumber_organization_unique',
            partialFilterExpression: { 
              salesVoucherNumber: { $exists: true, $ne: null, $ne: '' } 
            }
          }
        );
        console.log('✅ Created compound unique index with partial filter');
      } catch (error) {
        console.log('⚠️  Error creating compound index:', error.message);
      }
    } else {
      console.log('\n✅ Compound index exists');
    }

    // List indexes again after potential creation
    const finalIndexes = await collection.indexes();
    console.log('\n=== FINAL INDEXES ===');
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}: ${JSON.stringify(index.key)} (Unique: ${index.unique || false}, Sparse: ${index.sparse || false})`);
    });

  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkCompoundIndex();