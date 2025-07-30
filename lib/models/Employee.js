import mongoose from 'mongoose';
import Counter from './Counter';

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  contactType: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date
  },
  salaryInfo: {
    basic: Number,
    allowances: Number,
    deductions: Number
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchCode: String
  },
  taxId: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  active: {
    type: Boolean,
    default: true
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

// Remove duplicate indexes to fix warnings
EmployeeSchema.index({ name: 1 });
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ department: 1 });

// Add indexes for performance
EmployeeSchema.index({ organization: 1 });

// We won't use a pre-validate hook since we'll explicitly create the ID
// before creating the employee in the setup function

// Define a virtual for the ledger account path
EmployeeSchema.virtual('ledgerPath').get(function() {
  return `Expenses:Salaries and Wages:${this.name}`;
});

// Static method to get ledger account path
EmployeeSchema.statics.getLedgerPath = function(employeeId) {
  return this.findOne({ employeeId })
    .then(employee => {
      if (!employee) throw new Error(`Employee ${employeeId} not found`);
      return employee.ledgerPath;
    });
};

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema); 
