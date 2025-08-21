import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

import dbConnect from '../lib/dbConnect.js';

async function fixJournalVoucherIndexes() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    const db = mongoose.connection.db;
    const collection = db.collection('journalvouchers');
    
    console.log('Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Drop the old unique index on referenceNo if it exists
    try {
      console.log('Attempting to drop referenceNo_1 index...');
      await collection.dropIndex('referenceNo_1');
      console.log('✅ Successfully dropped old referenceNo_1 index');
    } catch (error) {
      console.log('ℹ️  referenceNo_1 index does not exist or already dropped:', error.message);
    }
    
    // Create the new compound index
    try {
      console.log('Creating new compound index...');
      await collection.createIndex({ referenceNo: 1, organization: 1 }, { unique: true });
      console.log('✅ Successfully created new compound index: referenceNo_1_organization_1');
    } catch (error) {
      console.log('ℹ️  Compound index already exists or error creating:', error.message);
    }
    
    console.log('Index fix completed successfully!');
    
    // Check final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', JSON.stringify(finalIndexes, null, 2));
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    console.log('Closing database connection...');
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the fix
fixJournalVoucherIndexes().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});