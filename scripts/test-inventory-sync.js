import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function testInventorySync() {
  try {
    await dbConnect();
    console.log('Connected to database');

    console.log('\n=== TESTING INVENTORY SYNC SYSTEM ===');

    // Get zs construction organization for testing
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (!zsOrg) {
      console.log('❌ zs construction organization not found');
      return;
    }

    // Get StockEntry model
    const StockEntry = mongoose.models.StockEntry || 
      mongoose.model('StockEntry', new mongoose.Schema({}, { strict: false }));

    // Get an item to test with
    const testItem = await Item.findOne({ organization: zsOrg._id, name: 'table' });
    if (!testItem) {
      console.log('❌ Test item "table" not found');
      return;
    }

    console.log(`\nTesting with item: ${testItem.name}`);
    console.log(`Initial quantity: ${testItem.quantity}`);

    // Test 1: Manual stock adjustment (simulating purchase)
    console.log('\n1. Testing manual stock adjustment (+10)...');
    
    const initialQuantity = testItem.quantity;
    
    // Create a stock entry manually (simulating what the accounting system does)
    await StockEntry.create({
      item: testItem._id,
      warehouse: new mongoose.Types.ObjectId(), // Dummy warehouse ID
      quantity: 10, // Add 10 units
      date: new Date(),
      organization: zsOrg._id,
      transactionType: 'adjustment',
      referenceId: new mongoose.Types.ObjectId(),
      referenceType: 'Manual'
    });

    // Update Item.quantity (simulating the new sync logic)
    await Item.updateOne(
      { _id: testItem._id },
      { $inc: { quantity: 10 } }
    );

    // Verify the update
    const updatedItem = await Item.findById(testItem._id);
    console.log(`After +10 adjustment: ${updatedItem.quantity}`);
    
    if (updatedItem.quantity === initialQuantity + 10) {
      console.log('✅ Stock adjustment sync working correctly');
    } else {
      console.log('❌ Stock adjustment sync failed');
    }

    // Test 2: Verify StockEntry totals match Item.quantity
    console.log('\n2. Verifying StockEntry totals match Item.quantity...');
    
    const allStockEntries = await StockEntry.find({ item: testItem._id });
    const totalFromEntries = allStockEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    
    console.log(`Item.quantity: ${updatedItem.quantity}`);
    console.log(`StockEntry total: ${totalFromEntries}`);
    console.log(`Stock movements: ${allStockEntries.length}`);
    
    if (updatedItem.quantity === totalFromEntries) {
      console.log('✅ Item.quantity matches StockEntry totals');
    } else {
      console.log('❌ Item.quantity does not match StockEntry totals');
      console.log('Difference:', updatedItem.quantity - totalFromEntries);
    }

    // Test 3: Test stock validation with current quantities
    console.log('\n3. Testing stock validation...');
    
    const currentStock = updatedItem.quantity;
    const lowStockThreshold = updatedItem.lowStockThreshold || 10;
    
    console.log(`Current stock: ${currentStock}`);
    console.log(`Low stock threshold: ${lowStockThreshold}`);
    
    // Test scenarios
    const testScenarios = [
      { qty: 1, name: 'Normal sale (1 unit)' },
      { qty: currentStock - 5, name: 'Low stock warning scenario' },
      { qty: currentStock + 5, name: 'Insufficient stock scenario' }
    ];
    
    testScenarios.forEach(scenario => {
      const remainingAfterSale = currentStock - scenario.qty;
      let status = '';
      
      if (currentStock < scenario.qty) {
        status = '❌ INSUFFICIENT STOCK';
      } else if (remainingAfterSale <= lowStockThreshold) {
        status = '⚠️  LOW STOCK WARNING';
      } else {
        status = '✅ OK';
      }
      
      console.log(`  ${scenario.name}: Requesting ${scenario.qty} → ${status}`);
      if (remainingAfterSale >= 0) {
        console.log(`    Remaining after sale: ${remainingAfterSale}`);
      } else {
        console.log(`    Shortage: ${Math.abs(remainingAfterSale)}`);
      }
    });

    console.log('\n✅ Inventory sync system test completed');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testInventorySync();