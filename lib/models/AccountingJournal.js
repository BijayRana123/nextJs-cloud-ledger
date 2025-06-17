import mongoose from 'mongoose';

const AccountingJournalSchema = new mongoose.Schema({
  datetime: {
    type: Date,
    required: true,
    default: Date.now
  },
  memo: {
    type: String,
    required: true
  },
  book: {
    type: String,
    required: true,
    default: 'cloud_ledger'
  },
  voucherNumber: {
    type: String,
    required: true
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
AccountingJournalSchema.index({ datetime: -1 });
AccountingJournalSchema.index({ voucherNumber: 1 });
AccountingJournalSchema.index({ organization: 1 });

// Update the updatedAt timestamp before saving
AccountingJournalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.AccountingJournal || 
  mongoose.model('AccountingJournal', AccountingJournalSchema); 