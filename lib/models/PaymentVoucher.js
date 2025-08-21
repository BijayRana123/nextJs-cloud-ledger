import mongoose from 'mongoose';
import Counter from './Counter.js';

const PaymentVoucherSchema = new mongoose.Schema({
  paymentVoucherNumber: {
    type: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank', 'Check', 'CreditCard']
  },
  notes: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
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

// Remove the pre-save hook that auto-generates paymentVoucherNumber

// Update the updatedAt timestamp before saving
PaymentVoucherSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for performance
PaymentVoucherSchema.index({ paymentVoucherNumber: 1, organization: 1 }, { unique: true, sparse: true });
PaymentVoucherSchema.index({ supplier: 1 });
PaymentVoucherSchema.index({ organization: 1 });
PaymentVoucherSchema.index({ date: -1 });

// Remove old model from cache to avoid schema overwrite errors in dev
// and ensure the latest schema is always used
delete mongoose.models.PaymentVoucher;

export default mongoose.models.PaymentVoucher || 
  mongoose.model('PaymentVoucher', PaymentVoucherSchema); 
