// Add indexes for performance
reportInstanceSchema.index({ organization: 1 });
reportInstanceSchema.index({ template: 1 });
reportInstanceSchema.index({ generatedDate: -1 }); 