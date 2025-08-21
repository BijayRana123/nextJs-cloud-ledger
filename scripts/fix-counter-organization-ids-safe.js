import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import { SalesVoucher2 } from '../lib/models.js';
import Counter from '../lib/models/Counter.js';
import Organization from '../lib/models/Organization.js';

async function fixCounterOrganizationIdsSafe() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get all organizations
    const organizations = await Organization.find({}).select('_id name');
    console.log(`Found ${organizations.length} organizations`);

    // Create a mapping of organization names to IDs
    const orgNameToId = {};
    const orgIdToName = {};
    organizations.forEach(org => {
      orgNameToId[org.name] = org._id.toString();
      orgIdToName[org._id.toString()] = org.name;
    });

    // Get all counters
    const counters = await Counter.find({});
    console.log(`\nFound ${counters.length} counters`);

    // First, let's clean up duplicate counters by removing ones with organization names
    // when there's already one with organization ID
    for (const counter of counters) {
      if (counter.organization && !mongoose.Types.ObjectId.isValid(counter.organization)) {
        // This counter uses organization name
        const orgId = orgNameToId[counter.organization];
        if (orgId) {
          // Check if there's already a counter with the same name and organization ID
          const existingCounter = await Counter.findOne({
            name: counter.name,
            organization: orgId
          });
          
          if (existingCounter) {
            console.log(`Removing duplicate counter ${counter.name} with org name "${counter.organization}" (ID version exists)`);
            await Counter.deleteOne({ _id: counter._id });
          } else {
            console.log(`Updating counter ${counter.name} from org name "${counter.organization}" to org ID "${orgId}"`);
            await Counter.updateOne(
              { _id: counter._id },
              { organization: orgId }
            );
          }
        } else {
          console.log(`⚠️  Could not find organization ID for name: ${counter.organization}`);
        }
      }
    }

    // Now sync counter values with actual voucher numbers for sales vouchers specifically
    console.log('\n=== SYNCING SALES VOUCHER COUNTER VALUES ===');
    
    for (const org of organizations) {
      const orgId = org._id.toString();
      
      // Find highest sales voucher number for this organization
      const salesVouchers = await SalesVoucher2.find({
        organization: orgId,
        salesVoucherNumber: { $exists: true, $ne: null, $regex: /^SV-\d+$/ }
      }).select('salesVoucherNumber');

      let highestNum = 0;
      salesVouchers.forEach(voucher => {
        const numPart = parseInt(voucher.salesVoucherNumber.replace('SV-', ''));
        if (!isNaN(numPart) && numPart > highestNum) {
          highestNum = numPart;
        }
      });

      if (salesVouchers.length > 0) {
        console.log(`Org ${org.name} (${orgId}): Found ${salesVouchers.length} vouchers, highest number is ${highestNum}`);

        // Update or create counter for this organization
        const result = await Counter.findOneAndUpdate(
          { name: 'sales_voucher', organization: orgId },
          { 
            value: highestNum,
            prefix: 'SV-',
            paddingSize: 4
          },
          { upsert: true, new: true }
        );
        console.log(`  Set counter to value: ${result.value} (next will be ${result.value + 1})`);
      } else {
        console.log(`Org ${org.name} (${orgId}): No sales vouchers found`);
      }
    }

    console.log('\n✅ Counter synchronization completed');

    // Verify the fix
    const updatedCounters = await Counter.find({ name: 'sales_voucher' });
    console.log('\n=== FINAL SALES VOUCHER COUNTERS ===');
    updatedCounters.forEach(counter => {
      const orgName = orgIdToName[counter.organization] || 'Unknown';
      console.log(`Counter: ${counter.name} (Org: ${orgName} - ${counter.organization}) - Value: ${counter.value} - Next: SV-${(counter.value + 1).toString().padStart(4, '0')}`);
    });

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the fix
fixCounterOrganizationIdsSafe();