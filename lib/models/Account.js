// Add indexes for performance
AccountSchema.index({ organization: 1 });
AccountSchema.index({ code: 1 }); 
