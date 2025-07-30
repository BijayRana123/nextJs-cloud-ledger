// Add indexes for performance
documentLinkSchema.index({ organization: 1 });
documentLinkSchema.index({ document: 1 });
documentLinkSchema.index({ relatedTransaction: 1 }); 
