// Add indexes for performance
invoiceSchema.index({ organization: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ date: -1 }); 
