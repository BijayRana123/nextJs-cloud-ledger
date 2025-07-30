import mongoose from 'mongoose';
import Counter from './Counter.js';

const ReceiptVoucherSchema = new mongoose.Schema({
  receiptVoucherNumber: {
    type: String
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
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

// Remove the pre-save hook that auto-generates receiptVoucherNumber

ReceiptVoucherSchema.index({ receiptVoucherNumber: 1 }, { unique: true, sparse: true });
ReceiptVoucherSchema.index({ organization: 1, date: -1 });

// Remove old model from cache to avoid schema overwrite errors in dev
delete mongoose.models.ReceiptVoucher;

export default mongoose.models.ReceiptVoucher || 
  mongoose.model('ReceiptVoucher', ReceiptVoucherSchema); 
