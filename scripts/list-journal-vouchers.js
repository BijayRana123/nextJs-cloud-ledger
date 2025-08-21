import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env.local') });

import dbConnect from '../lib/dbConnect.js';

async function listJournalVouchers() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    const db = mongoose.connection.db;
    const collection = db.collection('journalvouchers');
    
    console.log('Fetching all journal vouchers...');
    const vouchers = await collection.find({}).toArray();
    
    console.log(`Found ${vouchers.length} journal vouchers:`);
    vouchers.forEach((voucher, index) => {
      console.log(`${index + 1}. ID: ${voucher._id}`);
      console.log(`   Reference: ${voucher.referenceNo}`);
      console.log(`   Memo: ${voucher.memo}`);
      console.log(`   Organization: ${voucher.organization}`);
      console.log(`   Date: ${voucher.date}`);
      console.log(`   Created: ${voucher.createdAt}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error listing journal vouchers:', error);
  } finally {
    console.log('Closing database connection...');
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
listJournalVouchers().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});