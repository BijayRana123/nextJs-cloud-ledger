import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item, Customer } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function demoStockWarningSystem() {
  try {
    await dbConnect();
    console.log('Connected to database');

    console.log('\n🎯 === STOCK WARNING SYSTEM DEMONSTRATION ===');

    // Get zs construction organization
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (!zsOrg) {
      console.log('❌ zs construction organization not found');
      return;
    }

    // Set up demo inventory with different stock levels
    console.log('\n📦 Setting up demo inventory...');
    
    const demoItems = [
      { name: 'bitumen', quantity: 50, threshold: 10, price: 100 },
      { name: 'table', quantity: 8, threshold: 10, price: 200 }
    ];

    for (const itemData of demoItems) {
      await Item.updateOne(
        { name: itemData.name, organization: zsOrg._id },
        { 
          quantity: itemData.quantity, 
          lowStockThreshold: itemData.threshold,
          defaultRate: itemData.price
        }
      );
      console.log(`  ✅ ${itemData.name}: ${itemData.quantity} units (threshold: ${itemData.threshold})`);
    }

    // Get the updated items
    const items = await Item.find({ 
      organization: zsOrg._id,
      name: { $in: ['bitumen', 'table'] }
    }).select('name quantity lowStockThreshold defaultRate');

    console.log('\n🛒 === TESTING DIFFERENT SALES SCENARIOS ===');

    // Scenario 1: Normal Sale (No warnings)
    console.log('\n1️⃣ SCENARIO: Normal Sale (No Stock Issues)');
    const normalSale = [
      { item: items.find(i => i.name === 'bitumen')._id, quantity: 20, price: 100 }
    ];
    
    const result1 = await simulateStockValidation(normalSale, zsOrg._id);
    displayValidationResult(result1, 'Normal sale of 20 bitumen units');

    // Scenario 2: Low Stock Warning
    console.log('\n2️⃣ SCENARIO: Low Stock Warning');
    const lowStockSale = [
      { item: items.find(i => i.name === 'bitumen')._id, quantity: 45, price: 100 }
    ];
    
    const result2 = await simulateStockValidation(lowStockSale, zsOrg._id);
    displayValidationResult(result2, 'Sale of 45 bitumen units (will leave 5 remaining)');

    // Scenario 3: Insufficient Stock
    console.log('\n3️⃣ SCENARIO: Insufficient Stock (Sale Blocked)');
    const insufficientSale = [
      { item: items.find(i => i.name === 'table')._id, quantity: 15, price: 200 }
    ];
    
    const result3 = await simulateStockValidation(insufficientSale, zsOrg._id);
    displayValidationResult(result3, 'Attempted sale of 15 table units (only 8 available)');

    // Scenario 4: Mixed Items (Some warnings, some normal)
    console.log('\n4️⃣ SCENARIO: Mixed Items Sale');
    const mixedSale = [
      { item: items.find(i => i.name === 'bitumen')._id, quantity: 10, price: 100 }, // Normal
      { item: items.find(i => i.name === 'table')._id, quantity: 6, price: 200 }     // Low stock warning
    ];
    
    const result4 = await simulateStockValidation(mixedSale, zsOrg._id);
    displayValidationResult(result4, 'Mixed sale: 10 bitumen + 6 table units');

    // Scenario 5: Multiple Stock Issues
    console.log('\n5️⃣ SCENARIO: Multiple Stock Issues');
    const multipleIssues = [
      { item: items.find(i => i.name === 'bitumen')._id, quantity: 60, price: 100 }, // Insufficient
      { item: items.find(i => i.name === 'table')._id, quantity: 12, price: 200 }   // Insufficient
    ];
    
    const result5 = await simulateStockValidation(multipleIssues, zsOrg._id);
    displayValidationResult(result5, 'Multiple insufficient stock items');

    console.log('\n📊 === CURRENT INVENTORY STATUS ===');
    const currentItems = await Item.find({ organization: zsOrg._id }).select('name quantity lowStockThreshold');
    
    currentItems.forEach(item => {
      const status = item.quantity <= item.lowStockThreshold ? '⚠️  LOW STOCK' : '✅ OK';
      const percentage = item.lowStockThreshold > 0 ? Math.round((item.quantity / item.lowStockThreshold) * 100) : 0;
      console.log(`  ${item.name}: ${item.quantity} units ${status} (${percentage}% of threshold)`);
    });

    console.log('\n🎯 === STOCK WARNING SYSTEM FEATURES ===');
    console.log('✅ Pre-sale stock validation prevents overselling');
    console.log('✅ Low stock warnings help maintain inventory levels');
    console.log('✅ Clear error messages guide user actions');
    console.log('✅ Mixed scenarios handled appropriately');
    console.log('✅ Real-time inventory tracking');

    console.log('\n📱 === FRONTEND INTEGRATION POINTS ===');
    console.log('1. Call /api/organization/check-stock before form submission');
    console.log('2. Show StockWarningModal for warnings/errors');
    console.log('3. Block submission if insufficient stock');
    console.log('4. Allow proceeding with warnings after user confirmation');
    console.log('5. Update inventory in real-time after successful sales');

    console.log('\n✅ Stock warning system demonstration completed!');

  } catch (error) {
    console.error('Error during demonstration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Simulate the stock validation logic (same as in the API)
async function simulateStockValidation(items, organizationId) {
  const stockWarnings = [];
  const stockErrors = [];
  
  for (const saleItem of items) {
    if (saleItem.item) {
      const inventoryItem = await Item.findOne({
        _id: saleItem.item,
        organization: organizationId
      });
      
      if (inventoryItem) {
        const currentStock = inventoryItem.quantity || 0;
        const requestedQty = saleItem.quantity || 0;
        const lowStockThreshold = inventoryItem.lowStockThreshold || 10;
        
        // Check if there's insufficient stock
        if (currentStock < requestedQty) {
          stockErrors.push({
            itemName: inventoryItem.name,
            currentStock,
            requestedQty,
            shortage: requestedQty - currentStock
          });
        }
        // Check if stock will be low after sale
        else if ((currentStock - requestedQty) <= lowStockThreshold) {
          stockWarnings.push({
            itemName: inventoryItem.name,
            currentStock,
            requestedQty,
            remainingAfterSale: currentStock - requestedQty,
            lowStockThreshold
          });
        }
      } else {
        stockErrors.push({
          itemName: 'Unknown Item',
          error: 'Item not found in inventory'
        });
      }
    }
  }

  return {
    errors: stockErrors,
    warnings: stockWarnings,
    canProceed: stockErrors.length === 0
  };
}

// Display validation results in a user-friendly format
function displayValidationResult(result, scenario) {
  console.log(`\n   📋 ${scenario}`);
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('   ✅ RESULT: Sale can proceed without issues');
  } else if (result.errors.length > 0) {
    console.log('   ❌ RESULT: Sale BLOCKED due to insufficient stock');
    result.errors.forEach(error => {
      if (error.shortage) {
        console.log(`      • ${error.itemName}: Need ${error.requestedQty}, have ${error.currentStock} (short by ${error.shortage})`);
      } else {
        console.log(`      • ${error.itemName}: ${error.error}`);
      }
    });
  } else if (result.warnings.length > 0) {
    console.log('   ⚠️  RESULT: Sale can proceed WITH WARNINGS');
    result.warnings.forEach(warning => {
      console.log(`      • ${warning.itemName}: ${warning.remainingAfterSale} remaining after sale (threshold: ${warning.lowStockThreshold})`);
    });
  }
  
  console.log(`   📊 Summary: ${result.errors.length} errors, ${result.warnings.length} warnings`);
}

// Run the demonstration
demoStockWarningSystem();