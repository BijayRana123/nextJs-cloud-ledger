import mongoose from 'mongoose';
import Counter from './Counter';

const CustomerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    // Making it not required so the pre-validate hook can generate it
    required: false,
    unique: true
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
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  contactType: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String
  },
  taxId: {
    type: String,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  notes: String,
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
  },
  relatedSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }
}, { 
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to object
});

// Remove duplicate indexes to fix warnings
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ email: 1 });

// Add indexes for performance
CustomerSchema.index({ organization: 1 });
CustomerSchema.index({ code: 1 });
CustomerSchema.index({ relatedSupplier: 1 });

// Pre-validate hook to generate customer ID if not provided
CustomerSchema.pre('validate', async function(next) {
  if (!this.customerId) {
    try {
      this.customerId = await Counter.getNextSequence('customer', {
        prefix: 'CUST-',
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

// Define ledgerPath as a property, not a virtual
CustomerSchema.methods.getLedgerPath = function() {
  return `Assets:Current Assets:Accounts Receivable:${this.name}`;
};

// Add a getter for ledgerPath that will be called by AccountingService
Object.defineProperty(CustomerSchema.methods, 'ledgerPath', {
  get: function() {
    return this.getLedgerPath();
  }
});

// Static method to get ledger account path
CustomerSchema.statics.getLedgerPath = function(customerId) {
  return this.findOne({ customerId })
    .then(customer => {
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      return customer.getLedgerPath();
    });
};

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema); 
