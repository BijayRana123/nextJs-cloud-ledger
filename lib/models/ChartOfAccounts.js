import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  subtype: {
    type: String,
    required: true,
    enum: [
      // Asset subtypes
      'current', 'fixed', 'intangible', 'other_asset',
      // Liability subtypes
      'current_liability', 'long_term_liability',
      // Equity subtypes
      'capital', 'drawings', 'retained_earnings',
      // Revenue subtypes
      'operating_revenue', 'other_revenue',
      // Expense subtypes
      'operating_expense', 'other_expense'
    ]
  },
  parent: {
    type: String,
    default: null
  },
  path: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isSubledger: {
    type: Boolean,
    default: false
  },
  subledgerType: {
    type: String,
    enum: [null, 'customer', 'supplier', 'employee', 'project', 'other'],
    default: null
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

// Add index for faster lookups
AccountSchema.index({ code: 1 });
AccountSchema.index({ path: 1 });
AccountSchema.index({ type: 1, subtype: 1 });
AccountSchema.index({ isSubledger: 1, subledgerType: 1 });

// Add indexes for performance
AccountSchema.index({ organization: 1 });

// Static method to create the default chart of accounts
AccountSchema.statics.createDefaultAccounts = async function() {
  const defaultAccounts = [
    // Asset accounts
    { code: '1000', name: 'Assets', type: 'asset', subtype: 'current', path: 'Assets' },
    { code: '1100', name: 'Current Assets', type: 'asset', subtype: 'current', parent: '1000', path: 'Assets:Current Assets' },
    { code: '1110', name: 'Cash and Bank', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Cash and Bank' },
    { code: '1120', name: 'Accounts Receivable', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Accounts Receivable', isSubledger: true, subledgerType: 'customer' },
    { code: '1130', name: 'Inventory', type: 'asset', subtype: 'current', parent: '1100', path: 'Assets:Current Assets:Inventory' },
    { code: '1200', name: 'Fixed Assets', type: 'asset', subtype: 'fixed', parent: '1000', path: 'Assets:Fixed Assets' },
    
    // Liability accounts
    { code: '2000', name: 'Liabilities', type: 'liability', subtype: 'current_liability', path: 'Liabilities' },
    { code: '2100', name: 'Current Liabilities', type: 'liability', subtype: 'current_liability', parent: '2000', path: 'Liabilities:Current Liabilities' },
    { code: '2110', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', parent: '2100', path: 'Liabilities:Current Liabilities:Accounts Payable', isSubledger: true, subledgerType: 'supplier' },
    { code: '2120', name: 'Taxes Payable', type: 'liability', subtype: 'current_liability', parent: '2100', path: 'Liabilities:Current Liabilities:Taxes Payable' },
    { code: '2200', name: 'Long Term Liabilities', type: 'liability', subtype: 'long_term_liability', parent: '2000', path: 'Liabilities:Long Term Liabilities' },
    
    // Equity accounts
    { code: '3000', name: 'Equity', type: 'equity', subtype: 'capital', path: 'Equity' },
    { code: '3100', name: 'Owner\'s Capital', type: 'equity', subtype: 'capital', parent: '3000', path: 'Equity:Owner\'s Capital' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings', parent: '3000', path: 'Equity:Retained Earnings' },
    
    // Revenue accounts
    { code: '4000', name: 'Revenue', type: 'revenue', subtype: 'operating_revenue', path: 'Revenue' },
    { code: '4100', name: 'Sales Revenue', type: 'revenue', subtype: 'operating_revenue', parent: '4000', path: 'Revenue:Sales Revenue' },
    { code: '4200', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue', parent: '4000', path: 'Revenue:Service Revenue' },
    { code: '4900', name: 'Other Revenue', type: 'revenue', subtype: 'other_revenue', parent: '4000', path: 'Revenue:Other Revenue' },
    
    // Expense accounts
    { code: '5000', name: 'Expenses', type: 'expense', subtype: 'operating_expense', path: 'Expenses' },
    { code: '5100', name: 'Cost of Goods Sold', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Cost of Goods Sold' },
    { code: '5200', name: 'Salaries and Wages', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Salaries and Wages', isSubledger: true, subledgerType: 'employee' },
    { code: '5300', name: 'Rent Expense', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Rent Expense' },
    { code: '5400', name: 'Utilities Expense', type: 'expense', subtype: 'operating_expense', parent: '5000', path: 'Expenses:Utilities Expense' },
    { code: '5900', name: 'Other Expenses', type: 'expense', subtype: 'other_expense', parent: '5000', path: 'Expenses:Other Expenses' }
  ];

  // Create accounts in bulk
  await this.insertMany(defaultAccounts);
};

export default mongoose.models.ChartOfAccount || mongoose.model('ChartOfAccount', AccountSchema); 