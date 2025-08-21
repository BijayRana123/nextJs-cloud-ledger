import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

dotenv.config({ path: '.env.local' });

async function fixReceiptVoucherCounters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Find all receipt voucher counters
    console.log('\n=== FINDING RECEIPT VOUCHER COUNTERS ===');
    const receiptCounters = await Counter.find({ name: 'receipt_voucher' });
    console.log(`Found ${receiptCounters.length} receipt voucher counters`);

    const countersToUpdate = [];
    const countersAlreadyCorrect = [];

    for (const counter of receiptCounters) {
      // Check if organization field is already an ObjectId (24 character hex string)
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(counter.organization);
      
      if (isObjectId) {
        console.log(`✅ Counter already uses ObjectId: ${counter.organization}`);
        countersAlreadyCorrect.push(counter);
      } else {
        console.log(`❌ Counter uses organization name: "${counter.organization}"`);
        
        // Try to find the organization by name
        const org = await Organization.findOne({ name: counter.organization });
        if (org) {
          console.log(`   Found organization: ${org.name} -> ${org._id}`);
          countersToUpdate.push({
            counter,
            newOrganizationId: org._id.toString()
          });
        } else {
          console.log(`   ⚠️  Organization not found for name: "${counter.organization}"`);
        }
      }
    }

    if (countersToUpdate.length === 0) {
      console.log('\n✅ All receipt voucher counters are already using organization IDs');
      return;
    }

    console.log(`\n=== UPDATING ${countersToUpdate.length} COUNTERS ===`);
    
    for (const { counter, newOrganizationId } of countersToUpdate) {
      console.log(`Updating counter: "${counter.organization}" -> ${newOrganizationId}`);
      
      // Check if a counter with the new organization ID already exists
      const existingCounter = await Counter.findOne({ 
        name: 'receipt_voucher', 
        organization: newOrganizationId 
      });

      if (existingCounter) {
        console.log(`   ⚠️  Counter with organization ID ${newOrganizationId} already exists (value: ${existingCounter.value})`);
        console.log(`   Current counter value: ${counter.value}`);
        
        // Keep the higher value to avoid conflicts
        const maxValue = Math.max(counter.value, existingCounter.value);
        console.log(`   Using max value: ${maxValue}`);
        
        // Update the existing counter with the max value
        await Counter.findByIdAndUpdate(existingCounter._id, { value: maxValue });
        
        // Delete the old counter with organization name
        await Counter.findByIdAndDelete(counter._id);
        console.log(`   ✅ Merged counters and deleted old one`);
      } else {
        // Simply update the organization field
        await Counter.findByIdAndUpdate(counter._id, { 
          organization: newOrganizationId 
        });
        console.log(`   ✅ Updated organization field`);
      }
    }

    // Verify the results
    console.log('\n=== VERIFICATION ===');
    const updatedCounters = await Counter.find({ name: 'receipt_voucher' });
    console.log(`Total receipt voucher counters after update: ${updatedCounters.length}`);
    
    for (const counter of updatedCounters) {
      const org = await Organization.findById(counter.organization);
      console.log(`Counter: ${counter.name} (Org: ${org?.name || 'Unknown'} - ${counter.organization}) - Value: ${counter.value} - Next: RcV-${(counter.value + 1).toString().padStart(5, '0')}`);
    }

    console.log('\n✅ Receipt voucher counter fix completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixReceiptVoucherCounters();