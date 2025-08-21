import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { Item } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';

async function testStockValidation() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get zs construction organization
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (!zsOrg) {
      console.log('❌ zs construction organization not found');
      return;
    }

    console.log(`Found zs construction org: ${zsOrg._id}`);

    // Update some items with stock for testing
    const testItems = await Item.find({ organization: zsOrg._id }).limit(2);
    
    if (testItems.length >= 2) {
      // Set first item to have sufficient stock
      await Item.updateOne(
        { _id: testItems[0]._id },
        { quantity: 50, lowStockThreshold: 10 }
      );
      console.log(`✅ Set "${testItems[0].name}" stock to 50 (threshold: 10)`);

      // Set second item to have low stock
      await Item.updateOne(
        { _id: testItems[1]._id },
        { quantity: 5, lowStockThreshold: 10 }
      );
      console.log(`✅ Set "${testItems[1].name}" stock to 5 (threshold: 10)`);

      console.log('\n=== TESTING STOCK VALIDATION SCENARIOS ===');

      // Test scenario 1: Normal sale (sufficient stock)
      console.log('\n1. Testing normal sale (sufficient stock):');
      const scenario1 = [
        { item: testItems[0]._id, quantity: 20 } // Requesting 20 from 50 stock
      ];
      await testStockScenario(scenario1, zsOrg._id, 'Normal sale');

      // Test scenario 2: Low stock warning
      console.log('\n2. Testing low stock warning:');
      const scenario2 = [
        { item: testItems[0]._id, quantity: 45 } // Requesting 45 from 50 stock (5 remaining = low stock)
      ];
      await testStockScenario(scenario2, zsOrg._id, 'Low stock warning');

      // Test scenario 3: Insufficient stock
      console.log('\n3. Testing insufficient stock:');
      const scenario3 = [
        { item: testItems[1]._id, quantity: 10 } // Requesting 10 from 5 stock
      ];
      await testStockScenario(scenario3, zsOrg._id, 'Insufficient stock');

      // Test scenario 4: Mixed scenario
      console.log('\n4. Testing mixed scenario:');
      const scenario4 = [
        { item: testItems[0]._id, quantity: 20 }, // Normal
        { item: testItems[1]._id, quantity: 3 }   // Will cause low stock warning (2 remaining)
      ];
      await testStockScenario(scenario4, zsOrg._id, 'Mixed scenario');

    } else {
      console.log('❌ Not enough items found for testing');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

async function testStockScenario(items, organizationId, scenarioName) {
  console.log(`\n--- ${scenarioName} ---`);
  
  const stockWarnings = [];
  const stockErrors = [];
  
  for (const saleItem of items) {
    const inventoryItem = await Item.findOne({
      _id: saleItem.item,
      organization: organizationId
    });
    
    if (inventoryItem) {
      const currentStock = inventoryItem.quantity || 0;
      const requestedQty = saleItem.quantity || 0;
      const lowStockThreshold = inventoryItem.lowStockThreshold || 10;
      
      console.log(`Item: ${inventoryItem.name}`);
      console.log(`  Current stock: ${currentStock}`);
      console.log(`  Requested: ${requestedQty}`);
      console.log(`  Threshold: ${lowStockThreshold}`);
      
      // Check if there's insufficient stock
      if (currentStock < requestedQty) {
        const error = {
          itemName: inventoryItem.name,
          currentStock,
          requestedQty,
          shortage: requestedQty - currentStock
        };
        stockErrors.push(error);
        console.log(`  ❌ INSUFFICIENT STOCK - Short by ${error.shortage}`);
      }
      // Check if stock will be low after sale
      else if ((currentStock - requestedQty) <= lowStockThreshold) {
        const warning = {
          itemName: inventoryItem.name,
          currentStock,
          requestedQty,
          remainingAfterSale: currentStock - requestedQty,
          lowStockThreshold
        };
        stockWarnings.push(warning);
        console.log(`  ⚠️  LOW STOCK WARNING - ${warning.remainingAfterSale} remaining after sale`);
      } else {
        console.log(`  ✅ OK - ${currentStock - requestedQty} remaining after sale`);
      }
    }
  }
  
  console.log(`\nResult: ${stockErrors.length} errors, ${stockWarnings.length} warnings`);
  if (stockErrors.length > 0) {
    console.log('❌ SALE WOULD BE BLOCKED');
  } else if (stockWarnings.length > 0) {
    console.log('⚠️  SALE ALLOWED WITH WARNINGS');
  } else {
    console.log('✅ SALE ALLOWED');
  }
}

// Run the test
testStockValidation();