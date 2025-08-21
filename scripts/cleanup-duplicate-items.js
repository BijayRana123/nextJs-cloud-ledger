import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';

async function cleanupDuplicateItems() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find all items grouped by name and organization
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: { name: "$name", organization: "$organization" },
          items: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`Found ${duplicates.length} sets of duplicate items`);

    for (const duplicate of duplicates) {
      const { name, organization } = duplicate._id;
      const items = duplicate.items;
      
      console.log(`\nProcessing duplicates for item: ${name} in organization: ${organization}`);
      console.log(`Found ${items.length} duplicates`);

      // Keep the first item (usually the oldest) and remove the rest
      const itemsToKeep = items[0];
      const itemsToRemove = items.slice(1);

      console.log(`Keeping item with ID: ${itemsToKeep._id}`);
      console.log(`Removing ${itemsToRemove.length} duplicate items`);

      // Remove duplicate items
      for (const item of itemsToRemove) {
        await Item.findByIdAndDelete(item._id);
        console.log(`Removed duplicate item with ID: ${item._id}`);
      }
    }

    console.log('\nCleanup completed successfully');
    
    // Verify no duplicates remain
    const remainingDuplicates = await Item.aggregate([
      {
        $group: {
          _id: { name: "$name", organization: "$organization" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicate items remain');
    } else {
      console.log(`⚠️  Still found ${remainingDuplicates.length} sets of duplicates`);
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the cleanup
cleanupDuplicateItems();