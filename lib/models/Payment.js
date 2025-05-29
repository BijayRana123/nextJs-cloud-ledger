// Add indexes for performance
paymentSchema.index({ organization: 1 });
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ date: -1 }); 