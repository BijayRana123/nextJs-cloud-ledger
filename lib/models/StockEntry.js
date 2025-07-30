// Add indexes for performance
stockEntrySchema.index({ organization: 1 });
stockEntrySchema.index({ item: 1 });
stockEntrySchema.index({ warehouse: 1 });
stockEntrySchema.index({ date: -1 }); 
