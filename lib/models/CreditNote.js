// Add indexes for performance
creditNoteSchema.index({ organization: 1 });
creditNoteSchema.index({ creditNoteNumber: 1 });
creditNoteSchema.index({ date: -1 }); 
