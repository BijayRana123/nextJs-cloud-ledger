import mongoose from 'mongoose';

// Define a schema for counters to track sequences
const CounterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  value: { 
    type: Number, 
    default: 0 
  },
  paddingSize: {
    type: Number,
    default: 4
  },
  organization: {
    type: String,
    required: true
  }
});

// Method to get the next sequence number
CounterSchema.statics.getNextSequence = async function(name, options = {}) {
  const { 
    prefix = '', 
    startValue = 1, 
    paddingSize = 4,
    organization = ''
  } = options;
  if (!organization) throw new Error('organization is required for organization-specific voucher numbering');
  // Use findOneAndUpdate to atomically increment the counter, scoped by organization
  const counter = await this.findOneAndUpdate(
    { name, organization },
    { 
      $inc: { value: 1 },
      $setOnInsert: { 
        prefix: prefix,
        paddingSize,
        organization
      }
    },
    { 
      new: true, // Return the updated document
      upsert: true // Create if it doesn't exist
    }
  );

  // If the counter was just created, set its value to startValue and return the correct number
  if (counter.value === 1 && startValue !== 1) {
    counter.value = startValue;
    await counter.save();
  }
  
  // Format the sequence number with padding
  const paddedNumber = counter.value.toString().padStart(paddingSize, '0');
  return `${counter.prefix}${paddedNumber}`;
};

// Add unique compound index for (name, organization)
CounterSchema.index({ name: 1, organization: 1 }, { unique: true });

// Export the model
export default mongoose.models.Counter || 
  mongoose.model('Counter', CounterSchema); 
