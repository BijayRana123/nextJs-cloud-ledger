import mongoose from 'mongoose';

// Define a schema for counters to track sequences
const CounterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
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
    default: ''
  }
});

// Method to get the next sequence number
CounterSchema.statics.getNextSequence = async function(name, options = {}) {
  const { 
    prefix = '', 
    startValue = 1, 
    paddingSize = 4
  } = options;
  
  // Use findOneAndUpdate to atomically increment the counter
  const counter = await this.findOneAndUpdate(
    { name },
    { 
      $inc: { value: 1 },
      $setOnInsert: { 
        prefix,
        paddingSize
      }
    },
    { 
      new: true, // Return the updated document
      upsert: true // Create if it doesn't exist
    }
  );
  
  // Format the sequence number with padding
  const paddedNumber = counter.value.toString().padStart(paddingSize, '0');
  return `${prefix}${paddedNumber}`;
};

// Add indexes for performance
CounterSchema.index({ name: 1 });
CounterSchema.index({ organization: 1 });

// Export the model
export default mongoose.models.Counter || 
  mongoose.model('Counter', CounterSchema); 