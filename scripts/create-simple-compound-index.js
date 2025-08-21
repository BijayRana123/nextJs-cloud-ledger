import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';

async function createSimpleCompoundIndex() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get the collection directly
    const collection = mongoose.connection.db.collection('salesvoucher2');

    // Create the compound index with simple partial filter
    try {
      await collection.createIndex(
        { salesVoucherNumber: 1, organization: 1 }, 
        { 
          unique: true,
          name: 'salesVoucherNumber_organization_unique',
          partialFilterExpression: { 
            salesVoucherNumber: { $exists: true, $type: "string" } 
          }
        }
      );
      console.log('✅ Created compound unique index with partial filter');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Compound index already exists');
      } else {
        console.log('⚠️  Error creating compound index:', error.message);
        
        // Try without partial filter
        console.log('Trying without partial filter...');
        try {
          await collection.createIndex(
            { salesVoucherNumber: 1, organization: 1 }, 
            { 
              unique: true,
              sparse: true,
              name: 'salesVoucherNumber_organization_unique_sparse'
            }
          );
          console.log('✅ Created compound unique index with sparse option');
        } catch (error2) {
          console.log('⚠️  Error creating sparse compound index:', error2.message);
        }
      }
    }

    // List final indexes
    const indexes = await collection.indexes();
    console.log('\n=== FINAL INDEXES ===');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`);
      console.log(`   Key: ${JSON.stringify(index.key)}`);
      console.log(`   Unique: ${index.unique || false}`);
      console.log(`   Sparse: ${index.sparse || false}`);
      if (index.partialFilterExpression) {
        console.log(`   Partial Filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    console.log('\n✅ Index setup completed');

  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the setup
createSimpleCompoundIndex();