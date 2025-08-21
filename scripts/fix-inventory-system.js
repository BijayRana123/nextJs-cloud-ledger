import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function fixInventorySystem() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get StockEntry model
    const StockEntry = mongoose.models.StockEntry || 
      mongoose.model('StockEntry', new mongoose.Schema({}, { strict: false }));

    console.log('\n=== FIXING INVENTORY SYSTEM ===');

    // Step 1: Remove orphaned stock entries for deleted vouchers
    const deletedVoucherIds = [
      '689aef2b7a590ecde33b9e5a', // zs construction
      '689aed787a590ecde33b9e1c', // zs construction  
      '689aeb04ff309fbd0e0fda32'  // zs construction
    ];

    console.log('\n1. Removing orphaned stock entries...');
    let totalOrphanedEntries = 0;
    
    for (const voucherId of deletedVoucherIds) {
      const orphanedEntries = await StockEntry.find({
        referenceId: voucherId,
        referenceType: 'SalesVoucher'
      });

      if (orphanedEntries.length > 0) {
        console.log(`Found ${orphanedEntries.length} orphaned stock entries for voucher ${voucherId}`);
        
        for (const entry of orphanedEntries) {
          const item = await Item.findById(entry.item).select('name');
          console.log(`  - Removing: Item ${item?.name || 'Unknown'}, Quantity: ${entry.quantity}`);
        }

        const deleteResult = await StockEntry.deleteMany({
          referenceId: voucherId,
          referenceType: 'SalesVoucher'
        });
        
        console.log(`  ✅ Deleted ${deleteResult.deletedCount} orphaned stock entries`);
        totalOrphanedEntries += deleteResult.deletedCount;
      }
    }

    console.log(`\nTotal orphaned stock entries removed: ${totalOrphanedEntries}`);

    // Step 2: Update Item.quantity to reflect actual StockEntry totals
    console.log('\n2. Synchronizing Item quantities with StockEntry totals...');
    
    const allItems = await Item.find({}).select('name quantity organization').populate('organization', 'name');
    let updatedItems = 0;

    for (const item of allItems) {
      // Calculate actual quantity from StockEntry records
      const stockEntries = await StockEntry.find({ item: item._id });
      const calculatedQuantity = stockEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
      
      // Only update if there's a difference
      if (item.quantity !== calculatedQuantity) {
        console.log(`\nItem: ${item.name} (${item.organization?.name})`);
        console.log(`  Current quantity: ${item.quantity}`);
        console.log(`  Calculated from StockEntries: ${calculatedQuantity}`);
        console.log(`  Stock movements: ${stockEntries.length}`);
        
        // Show stock movements for context
        if (stockEntries.length > 0) {
          console.log(`  Movements:`);
          stockEntries.forEach((entry, index) => {
            console.log(`    ${index + 1}. ${entry.quantity > 0 ? '+' : ''}${entry.quantity} (${entry.transactionType}) - ${entry.date}`);
          });
        }

        // Update the item quantity
        await Item.updateOne(
          { _id: item._id },
          { quantity: calculatedQuantity }
        );
        
        console.log(`  ✅ Updated quantity from ${item.quantity} to ${calculatedQuantity}`);
        updatedItems++;
      }
    }

    console.log(`\nTotal items updated: ${updatedItems}`);

    // Step 3: Update the accounting system to sync Item.quantity automatically
    console.log('\n3. Checking if accounting system needs updates...');
    
    // This will be handled by updating the accounting.js file
    console.log('ℹ️  The accounting system will be updated to sync Item.quantity automatically');

    // Step 4: Verify the fixes
    console.log('\n=== VERIFICATION ===');
    
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (zsOrg) {
      const zsItems = await Item.find({ organization: zsOrg._id }).select('name quantity');
      
      console.log('\nzs construction items after fix:');
      for (const item of zsItems) {
        const stockEntries = await StockEntry.find({ item: item._id });
        const calculatedQuantity = stockEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
        
        const status = item.quantity === calculatedQuantity ? '✅' : '❌';
        console.log(`  ${status} ${item.name}: Quantity ${item.quantity}, StockEntry total: ${calculatedQuantity}`);
      }
    }

    // Check for any remaining orphaned stock entries
    const remainingOrphaned = await StockEntry.find({
      referenceId: { $in: deletedVoucherIds },
      referenceType: 'SalesVoucher'
    });

    if (remainingOrphaned.length === 0) {
      console.log('\n✅ No remaining orphaned stock entries');
    } else {
      console.log(`\n❌ ${remainingOrphaned.length} orphaned stock entries still exist`);
    }

    console.log('\n✅ Inventory system fix completed');

  } catch (error) {
    console.error('Error during inventory fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the fix
fixInventorySystem();