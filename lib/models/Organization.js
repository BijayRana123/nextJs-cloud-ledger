import mongoose from 'mongoose';
import Counter from './Counter.js';

const OrganizationSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// No need for explicit indexes since we're using built-in unique constraints

// Add indexes for performance and uniqueness
OrganizationSchema.index({ name: 1 }, { unique: true });
OrganizationSchema.index({ organizationId: 1 }, { unique: true });

// Pre-validate hook to ensure ID is generated before validation
OrganizationSchema.pre('validate', async function(next) {
  if (!this.organizationId) {
    try {
      this.organizationId = await Counter.getNextSequence('organization', {
        prefix: 'ORG-',
        paddingSize: 5
      });
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema); 
