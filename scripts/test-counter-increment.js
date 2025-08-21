import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

dotenv.config({ path: '.env.local' });

async function testCounterIncrement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Test with zs construction organization
    const zsConstructionId = '68146d98ce2735900445a58e';
    
    console.log('\n=== TESTING COUNTER INCREMENT FOR ZS CONSTRUCTION ===');
    console.log(`Organization ID: ${zsConstructionId}`);
    
    // Check current counter value
    const currentCounter = await Counter.findOne({ 
      name: 'receipt_voucher', 
      organization: zsConstructionId 
    });
    
    if (currentCounter) {
      console.log(`Current counter value: ${currentCounter.value}`);
      console.log(`Next voucher should be: RcV-${(currentCounter.value + 1).toString().padStart(5, '0')}`);
    } else {
      console.log('No counter found for this organization');
    }

    // Simulate the counter increment (same logic as in the API)
    console.log('\n=== SIMULATING COUNTER INCREMENT ===');
    const updatedCounter = await Counter.findOneAndUpdate(
      { name: 'receipt_voucher', organization: zsConstructionId.toString() },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    
    if (updatedCounter) {
      const receiptVoucherNumber = `RcV-${updatedCounter.value.toString().padStart(5, '0')}`;
      console.log(`Counter incremented to: ${updatedCounter.value}`);
      console.log(`Generated voucher number: ${receiptVoucherNumber}`);
    } else {
      console.log('Failed to increment counter');
    }

    // Check if this voucher number already exists
    console.log('\n=== CHECKING FOR EXISTING VOUCHER ===');
    const ReceiptVoucher = (await import('../lib/models/ReceiptVoucher.js')).default;
    const existingVoucher = await ReceiptVoucher.findOne({ 
      receiptVoucherNumber: `RcV-${updatedCounter.value.toString().padStart(5, '0')}`,
      organization: zsConstructionId
    });
    
    if (existingVoucher) {
      console.log(`❌ Voucher ${receiptVoucherNumber} already exists!`);
      console.log(`   Existing voucher ID: ${existingVoucher._id}`);
      console.log(`   Date: ${existingVoucher.date}`);
    } else {
      console.log(`✅ Voucher ${receiptVoucherNumber} is unique for this organization`);
    }

    // Check across all organizations
    console.log('\n=== CHECKING ACROSS ALL ORGANIZATIONS ===');
    const allVouchersWithSameNumber = await ReceiptVoucher.find({ 
      receiptVoucherNumber: `RcV-${updatedCounter.value.toString().padStart(5, '0')}`
    }).populate('organization', 'name');
    
    if (allVouchersWithSameNumber.length > 0) {
      console.log(`Found ${allVouchersWithSameNumber.length} voucher(s) with same number across all organizations:`);
      for (const voucher of allVouchersWithSameNumber) {
        console.log(`   - Org: ${voucher.organization?.name} (${voucher.organization?._id}), Amount: ${voucher.amount}`);
      }
    } else {
      console.log(`No vouchers found with number ${receiptVoucherNumber} across all organizations`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testCounterIncrement();