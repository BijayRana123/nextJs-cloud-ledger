import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function investigateInventorySystem() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get StockEntry model
    const StockEntry = mongoose.models.StockEntry || 
      mongoose.model('StockEntry', new mongoose.Schema({}, { strict: false }));

    console.log('\n=== INVESTIGATING INVENTORY SYSTEM ===');

    // Check if StockEntry records exist
    const stockEntries = await StockEntry.find({}).limit(10);
    console.log(`Found ${stockEntries.length} stock entries in database`);

    if (stockEntries.length > 0) {
      console.log('\nSample stock entries:');
      stockEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. Item: ${entry.item}, Quantity: ${entry.quantity}, Type: ${entry.transactionType}, Date: ${entry.date}`);
      });
    }

    // Check for stock entries related to deleted vouchers
    const deletedVoucherIds = [
      '689aef2b7a590ecde33b9e5a', // zs construction
      '689aed787a590ecde33b9e1c', // zs construction  
      '689aeb04ff309fbd0e0fda32'  // zs construction
    ];

    console.log('\n=== CHECKING FOR ORPHANED STOCK ENTRIES ===');
    for (const voucherId of deletedVoucherIds) {
      const orphanedStockEntries = await StockEntry.find({
        referenceId: voucherId,
        referenceType: 'SalesVoucher'
      });

      if (orphanedStockEntries.length > 0) {
        console.log(`❌ Found ${orphanedStockEntries.length} orphaned stock entries for deleted voucher ${voucherId}`);
        for (const entry of orphanedStockEntries) {
          const item = await Item.findById(entry.item).select('name');
          console.log(`  - Item: ${item?.name || 'Unknown'}, Quantity: ${entry.quantity}, Date: ${entry.date}`);
        }
      } else {
        console.log(`✅ No orphaned stock entries found for voucher ${voucherId}`);
      }
    }

    // Check current Item quantities vs StockEntry totals
    console.log('\n=== COMPARING ITEM QUANTITIES WITH STOCK ENTRIES ===');
    
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (zsOrg) {
      const zsItems = await Item.find({ organization: zsOrg._id }).select('name quantity');
      
      console.log(`\nzs construction items:`);
      for (const item of zsItems) {
        // Calculate total stock movements for this item
        const stockMovements = await StockEntry.find({ item: item._id });
        const totalMovement = stockMovements.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
        
        console.log(`  ${item.name}:`);
        console.log(`    Item.quantity: ${item.quantity}`);
        console.log(`    StockEntry total: ${totalMovement}`);
        console.log(`    Stock movements: ${stockMovements.length}`);
        
        if (stockMovements.length > 0) {
          stockMovements.forEach((movement, index) => {
            console.log(`      ${index + 1}. ${movement.quantity} (${movement.transactionType}) - ${movement.date}`);
          });
        }
      }
    }

    // Check if there's a system to sync Item.quantity with StockEntry totals
    console.log('\n=== CHECKING INVENTORY SYNC SYSTEM ===');
    
    // Look for any functions that might sync inventory
    const allItems = await Item.find({}).select('name quantity organization').populate('organization', 'name').limit(5);
    
    console.log('Sample items with their quantities:');
    for (const item of allItems) {
      const stockMovements = await StockEntry.find({ item: item._id });
      const calculatedQuantity = stockMovements.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
      
      console.log(`  ${item.name} (${item.organization?.name}):`);
      console.log(`    Stored quantity: ${item.quantity}`);
      console.log(`    Calculated from StockEntries: ${calculatedQuantity}`);
      console.log(`    Difference: ${item.quantity - calculatedQuantity}`);
    }

  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the investigation
investigateInventorySystem();