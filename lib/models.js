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

// Define Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactType: {
    type: String, // e.g., 'Customer', 'Supplier', 'Lead'
    required: true,
  },
  address: {
    type: String,
  },
  code: {
    type: String,
    required: true,
    unique: true, // Assuming code should be unique
  },
  pan: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  group: {
    type: String, // Or a reference to a Group model
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

// Create Supplier Model
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

// Define Purchase Order Item Schema
const purchaseOrderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // Reference to the Item model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Define Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  purchaseOrderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier', // Reference to the Supplier model
    required: true,
  },
  items: [purchaseOrderItemSchema], // Array of purchase order items
  totalAmount: {
    type: Number,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'CANCELLED'], // Example statuses
    default: 'DRAFT',
    required: true,
  },
});

// Create Purchase Order Model
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);

// Define Purchase Bill Item Schema (can reuse purchaseOrderItemSchema if structure is similar)
// Assuming a similar structure to Purchase Order items for now
const purchaseBillItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // Reference to the Item model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // You might add fields like lineTotal, tax, etc.
});


// Define Purchase Bill Schema
const purchaseBillSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier', // Reference to the Supplier model
    required: true,
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder', // Optional reference to a PurchaseOrder
  },
  referenceNo: {
    type: String, // Supplier's invoice number
    required: true,
    unique: true, // Assuming reference number is unique per supplier/organization
  },
  date: {
    type: Date,
    required: true,
  },
  items: [purchaseBillItemSchema], // Array of purchase bill items
  totalAmount: {
    type: Number,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'RECEIVED', 'PAID', 'CANCELLED'], // Example statuses
    default: 'DRAFT',
    required: true,
  },
  // Add timestamps for createdAt and updatedAt
}, { timestamps: true });


// Create Purchase Bill Model
const PurchaseBill = mongoose.models.PurchaseBill || mongoose.model('PurchaseBill', purchaseBillSchema);


// Define Customer Schema
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactType: {
    type: String, // e.g., 'Customer', 'Lead'
    required: true,
  },
  address: {
    type: String,
  },
  code: {
    type: String,
    required: true,
    unique: true, // Assuming code should be unique
  },
  pan: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  group: {
    type: String, // Or a reference to a Group model
  },
  // Reference to supplier if this customer is also a supplier
  relatedSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

// Create Customer Model
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

// Define Sales Order Item Schema
const salesOrderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // Reference to the Item model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
});

// Define Sales Order Schema
const salesOrderSchema = new mongoose.Schema({
  salesOrderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Reference to the Customer model
    required: true,
  },
  items: [salesOrderItemSchema], // Array of sales order items
  totalAmount: {
    type: Number,
    required: true,
  },
  referenceNo: {
    type: String,
  },
  billNumber: {
    type: String,
  },
  customerInvoiceReferenceNo: {
    type: String,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  exchangeRateToNPR: {
    type: Number,
    default: 1,
  },
  isExport: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'CANCELLED'], // Example statuses
    default: 'DRAFT',
    required: true,
  },
}, { timestamps: true });

// Create Sales Order Model
const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', salesOrderSchema);

// Define Sales Bill Item Schema
const salesBillItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item', // Reference to the Item model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
});

// Define Sales Bill Schema
const salesBillSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Reference to the Customer model
    required: true,
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder', // Optional reference to a SalesOrder
  },
  referenceNo: {
    type: String, // Our invoice number
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  items: [salesBillItemSchema], // Array of sales bill items
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  exchangeRateToNPR: {
    type: Number,
    default: 1,
  },
  isExport: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'DELIVERED', 'PAID', 'CANCELLED'], // Example statuses
    default: 'DRAFT',
    required: true,
  },
  // Add timestamps for createdAt and updatedAt
}, { timestamps: true });

// Create Sales Bill Model
const SalesBill = mongoose.models.SalesBill || mongoose.model('SalesBill', salesBillSchema);

// Define Sales Return Voucher Item Schema
const salesReturnVoucherItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
});

// Define Sales Return Voucher Schema
const salesReturnVoucherSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  referenceNo: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  items: [salesReturnVoucherItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  exchangeRateToNPR: {
    type: Number,
    default: 1,
  },
  isImport: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'CANCELLED'],
    default: 'DRAFT',
    required: true,
  },
}, { timestamps: true });

// Create Sales Return Voucher Model
const SalesReturnVoucher = mongoose.models.SalesReturnVoucher || mongoose.model('SalesReturnVoucher', salesReturnVoucherSchema);

// Define Purchase Return Voucher Item Schema
const purchaseReturnVoucherItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
});

// Define Purchase Return Voucher Schema
const purchaseReturnVoucherSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  referenceNo: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  items: [purchaseReturnVoucherItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  exchangeRateToNPR: {
    type: Number,
    default: 1,
  },
  isExport: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'CANCELLED'],
    default: 'DRAFT',
    required: true,
  },
}, { timestamps: true });

// Create Purchase Return Voucher Model
const PurchaseReturnVoucher = mongoose.models.PurchaseReturnVoucher || mongoose.model('PurchaseReturnVoucher', purchaseReturnVoucherSchema);

// Define Contra Voucher Schema
const contraVoucherSchema = new mongoose.Schema({
  referenceNo: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  fromAccount: {
    type: String,
    required: true,
  },
  toAccount: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NPR',
  },
  exchangeRateToNPR: {
    type: Number,
    default: 1,
  },
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPROVED', 'CANCELLED'],
    default: 'DRAFT',
    required: true,
  },
}, { timestamps: true });

const ContraVoucher = mongoose.models.ContraVoucher || mongoose.model('ContraVoucher', contraVoucherSchema);

export { 
  User, Organization, Role, Permission, Account, Transaction, TaxRate, 
  Item, Warehouse, StockEntry, Invoice, Payment, CreditNote, Document, 
  DocumentLink, ReportTemplate, ReportInstance, Supplier, PurchaseOrder, 
  PurchaseBill, Customer, SalesOrder, SalesBill, SalesReturnVoucher, 
  PurchaseReturnVoucher, ContraVoucher 
};
