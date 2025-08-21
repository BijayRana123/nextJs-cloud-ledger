import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function testReceiptVoucherCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Import models after connection
    const ReceiptVoucher = (await import('../lib/models/ReceiptVoucher.js')).default;
    const Counter = (await import('../lib/models/Counter.js')).default;
    const Organization = (await import('../lib/models/Organization.js')).default;
    const Customer = (await import('../lib/models/Customer.js')).default;

    // Test with zs construction organization
    const zsConstructionId = '68146d98ce2735900445a58e';
    
    console.log('\n=== TESTING RECEIPT VOUCHER CREATION FOR ZS CONSTRUCTION ===');
    
    // Find a customer for this organization
    const customer = await Customer.findOne({ organization: zsConstructionId });
    if (!customer) {
      console.log('❌ No customer found for zs construction organization');
      return;
    }
    
    console.log(`Using customer: ${customer.name} (${customer._id})`);

    // Check current counter
    const currentCounter = await Counter.findOne({ 
      name: 'receipt_voucher', 
      organization: zsConstructionId 
    });
    
    console.log(`Current counter value: ${currentCounter?.value || 'No counter'}`);

    // Simulate the receipt voucher creation process
    console.log('\n=== SIMULATING RECEIPT VOUCHER CREATION ===');
    
    // Step 1: Increment counter (same as in API)
    const counter = await Counter.findOneAndUpdate(
      { name: 'receipt_voucher', organization: zsConstructionId.toString() },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    
    const receiptVoucherNumber = `RcV-${counter.value.toString().padStart(5, '0')}`;
    console.log(`Generated voucher number: ${receiptVoucherNumber}`);

    // Step 2: Check if this number already exists for this organization
    const existingVoucher = await ReceiptVoucher.findOne({
      receiptVoucherNumber,
      organization: zsConstructionId
    });
    
    if (existingVoucher) {
      console.log(`❌ Voucher ${receiptVoucherNumber} already exists for this organization!`);
      return;
    }

    // Step 3: Try to create the receipt voucher
    console.log('\n=== CREATING RECEIPT VOUCHER ===');
    const testReceiptVoucher = new ReceiptVoucher({
      receiptVoucherNumber,
      customer: customer._id,
      amount: 1000,
      paymentMethod: 'Cash',
      notes: 'Test receipt voucher',
      organization: zsConstructionId,
      date: new Date()
    });

    try {
      const savedVoucher = await testReceiptVoucher.save();
      console.log(`✅ Successfully created receipt voucher: ${savedVoucher.receiptVoucherNumber}`);
      console.log(`   ID: ${savedVoucher._id}`);
      console.log(`   Amount: ${savedVoucher.amount}`);
      console.log(`   Customer: ${customer.name}`);
      
      // Clean up - delete the test voucher
      console.log('\n=== CLEANING UP TEST DATA ===');
      await ReceiptVoucher.findByIdAndDelete(savedVoucher._id);
      console.log('✅ Test voucher deleted');
      
      // Reset counter to previous value
      await Counter.findOneAndUpdate(
        { name: 'receipt_voucher', organization: zsConstructionId.toString() },
        { $inc: { value: -1 } }
      );
      console.log('✅ Counter reset to previous value');
      
    } catch (error) {
      console.log(`❌ Failed to create receipt voucher: ${error.message}`);
      
      if (error.code === 11000) {
        console.log('This is a duplicate key error. Let me check what\'s causing it...');
        
        // Check if there's a voucher with this number in ANY organization
        const anyVoucherWithSameNumber = await ReceiptVoucher.find({ 
          receiptVoucherNumber 
        }).populate('organization', 'name');
        
        if (anyVoucherWithSameNumber.length > 0) {
          console.log(`Found ${anyVoucherWithSameNumber.length} voucher(s) with number ${receiptVoucherNumber}:`);
          for (const voucher of anyVoucherWithSameNumber) {
            console.log(`   - Org: ${voucher.organization?.name} (${voucher.organization?._id})`);
          }
        }
      }
      
      // Reset counter since creation failed
      await Counter.findOneAndUpdate(
        { name: 'receipt_voucher', organization: zsConstructionId.toString() },
        { $inc: { value: -1 } }
      );
      console.log('Counter reset due to failed creation');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testReceiptVoucherCreation();