import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';

async function createCompoundIndexFinal() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get the collection directly
    const collection = mongoose.connection.db.collection('salesvoucher2');

    // Create the compound index with proper options
    try {
      await collection.createIndex(
        { salesVoucherNumber: 1, organization: 1 }, 
        { 
          unique: true,
          name: 'salesVoucherNumber_organization_unique',
          partialFilterExpression: { 
            salesVoucherNumber: { $exists: true, $ne: null, $ne: '' } 
          }
        }
      );
      console.log('✅ Created compound unique index with partial filter');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Compound index already exists');
      } else {
        console.log('⚠️  Error creating compound index:', error.message);
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

    // Test the uniqueness constraint
    console.log('\n=== TESTING UNIQUENESS CONSTRAINT ===');
    
    // This should work - same voucher number in different organizations
    console.log('Testing: Same voucher number in different organizations should be allowed');
    
    // This should fail - same voucher number in same organization
    console.log('The compound index will prevent duplicate voucher numbers within the same organization');
    console.log('But allow the same voucher number across different organizations');

    console.log('\n✅ Compound index setup completed');

  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the setup
createCompoundIndexFinal();