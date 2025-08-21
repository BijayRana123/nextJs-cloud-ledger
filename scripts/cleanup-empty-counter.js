import mongoose from 'mongoose';
import dbConnect from '../lib/dbConnect.js';
import Counter from '../lib/models/Counter.js';

async function cleanupEmptyCounter() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Remove counters with empty organization
    const result = await Counter.deleteMany({ 
      organization: { $in: ['', null] }
    });

    console.log(`Removed ${result.deletedCount} counters with empty organization`);

    // List remaining counters
    const remainingCounters = await Counter.find({});
    console.log(`\nRemaining ${remainingCounters.length} counters:`);
    remainingCounters.forEach(counter => {
      console.log(`  ${counter.name} (Org: ${counter.organization}) - Value: ${counter.value}`);
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
cleanupEmptyCounter();