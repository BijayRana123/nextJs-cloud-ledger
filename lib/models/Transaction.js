// Add indexes for performance
transactionSchema.index({ organization: 1 });
transactionSchema.index({ account: 1 });
transactionSchema.index({ date: -1 }); 