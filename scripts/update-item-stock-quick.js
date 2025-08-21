// Quick script to update item stock for testing
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateItemStock() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloud-ledger');
  
  try {
    await client.connect();
    const db = client.db();
    
    // Update the "dress" item stock to 10 for testing
    const result = await db.collection('items').updateOne(
      { name: "dress" },
      { 
        $set: { 
          quantity: 10, 
          lowStockThreshold: 5 
        } 
      }
    );
    
    console.log('✅ Updated dress stock to 10 units');
    
    // Also update other common items
    await db.collection('items').updateMany(
      { quantity: { $exists: false } },
      { 
        $set: { 
          quantity: 100, 
          lowStockThreshold: 10 
        } 
      }
    );
    
    console.log('✅ Updated all items without stock values');
    
    // Show current stock levels
    const items = await db.collection('items').find({}, { name: 1, quantity: 1, lowStockThreshold: 1 }).toArray();
    console.log('\n📊 Current Stock Levels:');
    items.forEach(item => {
      console.log(`- ${item.name}: ${item.quantity || 0} units (threshold: ${item.lowStockThreshold || 10})`);
    });
    
  } finally {
    await client.close();
  }
}

updateItemStock().catch(console.error);