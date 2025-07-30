import mongoose from 'mongoose';

const AccountingTransactionSchema = new mongoose.Schema({
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountingJournal',
    required: true
  },
  datetime: {
    type: Date,
    required: true,
    default: Date.now
  },
  account_path: {
    type: String,
    required: true
  },
  debit: {
    type: Boolean,
    required: true
  },
  credit: {
    type: Boolean,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Add indexes for performance
AccountingTransactionSchema.index({ journal: 1 });
AccountingTransactionSchema.index({ datetime: -1 });
AccountingTransactionSchema.index({ account_path: 1 });
AccountingTransactionSchema.index({ organization: 1 });

// Update the updatedAt timestamp before saving
AccountingTransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate that either debit or credit is true, but not both
AccountingTransactionSchema.pre('save', function(next) {
  if (this.debit === this.credit) {
    next(new Error('Transaction must be either debit or credit, not both or neither'));
  }
  next();
});

export default mongoose.models.AccountingTransaction || 
  mongoose.model('AccountingTransaction', AccountingTransactionSchema); 
