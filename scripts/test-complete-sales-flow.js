import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2, Item, Customer } from '../lib/models.js';
import Organization from '../lib/models/Organization.js';
import { createSalesVoucherEntry } from '../lib/accounting.js';

async function testCompleteSalesFlow() {
  try {
    await dbConnect();
    console.log('Connected to database');

    console.log('\n=== TESTING COMPLETE SALES VOUCHER FLOW ===');

    // Get zs construction organization
    const zsOrg = await Organization.findOne({ name: 'zs construction' });
    if (!zsOrg) {
      console.log('❌ zs construction organization not found');
      return;
    }

    // Get test items
    const testItems = await Item.find({ organization: zsOrg._id }).limit(2);
    if (testItems.length < 2) {
      console.log('❌ Not enough test items found');
      return;
    }

    console.log(`\nUsing organization: ${zsOrg.name} (${zsOrg._id})`);
    console.log(`Test items: ${testItems.map(item => `${item.name} (${item.quantity})`).join(', ')}`);

    // Set up test stock levels
    console.log('\n1. Setting up test stock levels...');
    await Item.updateOne({ _id: testItems[0]._id }, { quantity: 50, lowStockThreshold: 10 });
    await Item.updateOne({ _id: testItems[1]._id }, { quantity: 5, lowStockThreshold: 10 });
    
    const item1 = await Item.findById(testItems[0]._id);
    const item2 = await Item.findById(testItems[1]._id);
    
    console.log(`  ${item1.name}: ${item1.quantity} units (threshold: ${item1.lowStockThreshold})`);
    console.log(`  ${item2.name}: ${item2.quantity} units (threshold: ${item2.lowStockThreshold})`);

    // Create a test customer
    console.log('\n2. Creating test customer...');
    let testCustomer = await Customer.findOne({ name: 'Test Customer', organization: zsOrg._id });
    if (!testCustomer) {
      testCustomer = await Customer.create({
        name: 'Test Customer',
        contactType: 'Customer',
        code: 'CUST-TEST-001',
        organization: zsOrg._id
      });
    }
    console.log(`  Customer: ${testCustomer.name} (${testCustomer._id})`);

    // Test Scenario 1: Normal sale (should succeed)
    console.log('\n3. Testing normal sale scenario...');
    const normalSaleData = {
      customer: testCustomer._id,
      items: [
        {
          item: item1._id,
          quantity: 20,
          price: 100,
          itemName: item1.name
        }
      ],
      totalAmount: 2000,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      organization: zsOrg._id
    };

    const stockValidationResult1 = await validateStock(normalSaleData.items, zsOrg._id);
    console.log(`  Stock validation: ${stockValidationResult1.canProceed ? '✅ Can proceed' : '❌ Blocked'}`);
    console.log(`  Errors: ${stockValidationResult1.errors.length}, Warnings: ${stockValidationResult1.warnings.length}`);

    if (stockValidationResult1.canProceed) {
      console.log('  Creating sales voucher...');
      const result1 = await createTestSalesVoucher(normalSaleData, zsOrg);
      if (result1.success) {
        console.log(`  ✅ Sales voucher created: ${result1.voucherNumber}`);
        
        // Check updated stock
        const updatedItem1 = await Item.findById(item1._id);
        console.log(`  Updated stock: ${item1.name} now has ${updatedItem1.quantity} units`);
      } else {
        console.log(`  ❌ Failed: ${result1.error}`);
      }
    }

    // Test Scenario 2: Low stock warning (should succeed with warning)
    console.log('\n4. Testing low stock warning scenario...');
    const lowStockSaleData = {
      customer: testCustomer._id,
      items: [
        {
          item: item1._id,
          quantity: 25, // This will leave 5 units (below threshold of 10)
          price: 100,
          itemName: item1.name
        }
      ],
      totalAmount: 2500,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      organization: zsOrg._id
    };

    const stockValidationResult2 = await validateStock(lowStockSaleData.items, zsOrg._id);
    console.log(`  Stock validation: ${stockValidationResult2.canProceed ? '⚠️  Can proceed with warnings' : '❌ Blocked'}`);
    console.log(`  Errors: ${stockValidationResult2.errors.length}, Warnings: ${stockValidationResult2.warnings.length}`);
    
    if (stockValidationResult2.warnings.length > 0) {
      stockValidationResult2.warnings.forEach(warning => {
        console.log(`    ⚠️  ${warning.itemName}: ${warning.remainingAfterSale} remaining (threshold: ${warning.lowStockThreshold})`);
      });
    }

    if (stockValidationResult2.canProceed) {
      console.log('  User chooses to proceed despite warnings...');
      const result2 = await createTestSalesVoucher(lowStockSaleData, zsOrg);
      if (result2.success) {
        console.log(`  ✅ Sales voucher created: ${result2.voucherNumber}`);
        
        // Check updated stock
        const updatedItem1 = await Item.findById(item1._id);
        console.log(`  Updated stock: ${item1.name} now has ${updatedItem1.quantity} units`);
      } else {
        console.log(`  ❌ Failed: ${result2.error}`);
      }
    }

    // Test Scenario 3: Insufficient stock (should be blocked)
    console.log('\n5. Testing insufficient stock scenario...');
    const insufficientStockSaleData = {
      customer: testCustomer._id,
      items: [
        {
          item: item2._id,
          quantity: 10, // Requesting 10 but only 5 available
          price: 50,
          itemName: item2.name
        }
      ],
      totalAmount: 500,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      organization: zsOrg._id
    };

    const stockValidationResult3 = await validateStock(insufficientStockSaleData.items, zsOrg._id);
    console.log(`  Stock validation: ${stockValidationResult3.canProceed ? '✅ Can proceed' : '❌ Blocked'}`);
    console.log(`  Errors: ${stockValidationResult3.errors.length}, Warnings: ${stockValidationResult3.warnings.length}`);
    
    if (stockValidationResult3.errors.length > 0) {
      stockValidationResult3.errors.forEach(error => {
        console.log(`    ❌ ${error.itemName}: Need ${error.requestedQty}, only ${error.currentStock} available (short by ${error.shortage})`);
      });
      console.log('  Sale blocked - user must update stock or reduce quantity');
    }

    // Test Scenario 4: Mixed scenario
    console.log('\n6. Testing mixed scenario (multiple items)...');
    const mixedSaleData = {
      customer: testCustomer._id,
      items: [
        {
          item: item1._id,
          quantity: 2, // Normal
          price: 100,
          itemName: item1.name
        },
        {
          item: item2._id,
          quantity: 3, // Will cause low stock warning
          price: 50,
          itemName: item2.name
        }
      ],
      totalAmount: 350,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      organization: zsOrg._id
    };

    const stockValidationResult4 = await validateStock(mixedSaleData.items, zsOrg._id);
    console.log(`  Stock validation: ${stockValidationResult4.canProceed ? '⚠️  Can proceed with warnings' : '❌ Blocked'}`);
    console.log(`  Errors: ${stockValidationResult4.errors.length}, Warnings: ${stockValidationResult4.warnings.length}`);
    
    stockValidationResult4.warnings.forEach(warning => {
      console.log(`    ⚠️  ${warning.itemName}: ${warning.remainingAfterSale} remaining (threshold: ${warning.lowStockThreshold})`);
    });

    console.log('\n=== FINAL STOCK LEVELS ===');
    const finalItems = await Item.find({ organization: zsOrg._id }).select('name quantity lowStockThreshold');
    finalItems.forEach(item => {
      const status = item.quantity <= item.lowStockThreshold ? '⚠️  LOW' : '✅';
      console.log(`  ${item.name}: ${item.quantity} units ${status}`);
    });

    console.log('\n✅ Complete sales flow test completed');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Helper function to validate stock (simulates the API logic)
async function validateStock(items, organizationId) {
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

// Helper function to create a test sales voucher
async function createTestSalesVoucher(salesOrderData, organization) {
  try {
    // Create the sales voucher document
    const newSalesOrder = new SalesVoucher2(salesOrderData);
    await newSalesOrder.save();

    // Generate voucher number and create accounting entries
    const generatedVoucherNumber = await createSalesVoucherEntry(
      { ...newSalesOrder.toObject() },
      organization._id.toString(),
      organization.name
    );

    // Update the voucher with the generated number
    await SalesVoucher2.updateOne(
      { _id: newSalesOrder._id },
      { salesVoucherNumber: generatedVoucherNumber }
    );

    return {
      success: true,
      voucherNumber: generatedVoucherNumber,
      voucherId: newSalesOrder._id
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testCompleteSalesFlow();