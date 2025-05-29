import mongoose from 'mongoose';
import Counter from './Counter';

const SupplierSchema = new mongoose.Schema({
  supplierId: {
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
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchCode: String,
    swiftCode: String
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
  }
});

// Remove duplicate indexes to fix warnings
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ email: 1 });

// Add indexes for performance
SupplierSchema.index({ organization: 1 });
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ code: 1 });

// Pre-validate hook to generate supplier ID if not provided
SupplierSchema.pre('validate', async function(next) {
  if (!this.supplierId) {
    try {
      this.supplierId = await Counter.getNextSequence('supplier', {
        prefix: 'SUPP-',
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

// Define a virtual for the ledger account path
SupplierSchema.virtual('ledgerPath').get(function() {
  return `Liabilities:Current Liabilities:Accounts Payable:${this.name}`;
});

// Static method to get ledger account path
SupplierSchema.statics.getLedgerPath = function(supplierId) {
  return this.findOne({ supplierId })
    .then(supplier => {
      if (!supplier) throw new Error(`Supplier ${supplierId} not found`);
      return supplier.ledgerPath;
    });
};

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema); 