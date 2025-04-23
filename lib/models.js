import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
});

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // Optional: Could add an array of user references here if needed for specific queries,
  // but the primary relationship is from User to Organization.
  // users: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  // }],
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  organizations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  }],
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  }],
});

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String, // e.g., 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const taxRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const TaxRate = mongoose.models.TaxRate || mongoose.model('TaxRate', taxRateSchema);
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const stockEntrySchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
const StockEntry = mongoose.models.StockEntry || mongoose.model('StockEntry', stockEntrySchema);
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  customer: {
    type: String, // Or a reference to a Customer model if you create one later
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const creditNoteSchema = new mongoose.Schema({
  creditNoteNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
const CreditNote = mongoose.models.CreditNote || mongoose.model('CreditNote', creditNoteSchema);
const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Using Mixed type for JSON metadata
  },
});

const documentLinkSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
const DocumentLink = mongoose.models.DocumentLink || mongoose.model('DocumentLink', documentLinkSchema);
const reportTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  templateContent: {
    type: mongoose.Schema.Types.Mixed, // Flexible storage for template content
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const reportInstanceSchema = new mongoose.Schema({
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate',
    required: true,
  },
  generatedDate: {
    type: Date,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Store the generated report data
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

const ReportTemplate = mongoose.models.ReportTemplate || mongoose.model('ReportTemplate', reportTemplateSchema);
const ReportInstance = mongoose.models.ReportInstance || mongoose.model('ReportInstance', reportInstanceSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);


export { User, Organization, Role, Permission, Account, Transaction, TaxRate, Item, Warehouse, StockEntry, Invoice, Payment, CreditNote, Document, DocumentLink, ReportTemplate, ReportInstance };
