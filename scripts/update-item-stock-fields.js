import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';

async function updateItemStockFields() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Find items that don't have quantity or lowStockThreshold fields
    const itemsToUpdate = await Item.find({
      $or: [
        { quantity: { $exists: false } },
        { quantity: null },
        { quantity: undefined },
        { lowStockThreshold: { $exists: false } },
        { lowStockThreshold: null },
        { lowStockThreshold: undefined }
      ]
    }).select('name quantity lowStockThreshold organization');

    console.log(`Found ${itemsToUpdate.length} items that need stock field updates`);

    let updatedCount = 0;

    for (const item of itemsToUpdate) {
      const updateFields = {};
      
      // Set quantity to openingStock if it doesn't exist, otherwise 0
      if (item.quantity === undefined || item.quantity === null) {
        updateFields.quantity = item.openingStock || 0;
      }
      
      // Set default lowStockThreshold if it doesn't exist
      if (item.lowStockThreshold === undefined || item.lowStockThreshold === null) {
        updateFields.lowStockThreshold = 10;
      }

      if (Object.keys(updateFields).length > 0) {
        await Item.updateOne({ _id: item._id }, updateFields);
        console.log(`Updated item "${item.name}": ${JSON.stringify(updateFields)}`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} items with stock fields`);

    // Show summary of all items with their stock levels
    const allItems = await Item.find({}).select('name quantity lowStockThreshold organization').populate('organization', 'name');
    
    console.log('\n=== ITEM STOCK SUMMARY ===');
    const orgGroups = {};
    
    allItems.forEach(item => {
      const orgName = item.organization?.name || 'Unknown';
      if (!orgGroups[orgName]) {
        orgGroups[orgName] = [];
      }
      orgGroups[orgName].push(item);
    });

    Object.entries(orgGroups).forEach(([orgName, items]) => {
      console.log(`\n${orgName} (${items.length} items):`);
      items.forEach((item, index) => {
        const stockStatus = item.quantity <= item.lowStockThreshold ? '⚠️  LOW' : '✅';
        console.log(`  ${index + 1}. ${item.name} - Stock: ${item.quantity}, Threshold: ${item.lowStockThreshold} ${stockStatus}`);
      });
    });

  } catch (error) {
    console.error('Error updating item stock fields:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the update
updateItemStockFields();