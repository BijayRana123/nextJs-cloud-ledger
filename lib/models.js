import mongoose from 'mongoose';
import ReceiptVoucher from './models/ReceiptVoucher.js';

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
  code: {
    type: String,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Goods', 'Services'],
    default: 'Goods',
  },
  category: {
    type: String, // Changed to String to store category value directly
  },
  categoryLabel: {
    type: String, // Store the display label
  },
  tax: {
    type: String,
    default: 'No Vat',
  },
  primaryUnit: {
    type: String, // Changed to String to store unit value directly
  },
  primaryUnitLabel: {
    type: String, // Store the display label
  },
  availableForSale: {
    type: Boolean,
    default: true,
  },
  defaultQty: {
    type: Number,
    default: 1,
  },
  defaultRate: {
    type: Number,
    default: 0,
  },
  defaultDiscount: {
    type: Number,
    default: 0,
  },
  defaultTax: {
    type: Number,
    default: 0,
  },
  openingStock: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, {
  timestamps: true,
});

// Create compound index for unique name per organization to prevent duplicate inventory items
itemSchema.index({ name: 1, organization: 1 }, { unique: true });

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
  // Additional fields to track transaction details
  transactionType: { 
    type: String, 
    enum: ['opening', 'sales', 'purchase', 'sales_return', 'purchase_return', 'adjustment'],
    default: 'adjustment'
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // ID of the related document
  referenceType: { type: String }, // Type of the related document
  notes: { type: String }, // Additional notes
}, { timestamps: true });

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
    required: false,
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
  referenceNo: {
    type: String,
    required: false,
    sparse: true, // Removed global unique constraint
  },
  dueDate: {
    type: Date,
  },
  supplierBillNo: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  items: [purchaseOrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

// Add compound unique index for referenceNo per organization
purchaseOrderSchema.index(
  { referenceNo: 1, organization: 1 }, 
  { unique: true, sparse: true }
);

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
  supplierBillNo: {
    type: String, // Manually entered supplier bill number
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

// Define Sales Voucher Item Schema
const salesVoucherItemSchema = new mongoose.Schema({
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

// Define Sales Voucher Schema
const salesVoucherSchema = new mongoose.Schema({
  salesVoucherNumber: {
    type: String,
    required: false,
    sparse: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // Reference to the Customer model
    required: false, // Make it optional for cash sales
  },
  items: [salesVoucherItemSchema], // Array of sales voucher items
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
}, { timestamps: true });

// Create compound unique index for voucher number per organization
salesVoucherSchema.index({ salesVoucherNumber: 1, organization: 1 }, { unique: true, sparse: true });

// Create Sales Voucher Model
const SalesVoucher2 = mongoose.models.SalesVoucher2 || mongoose.model('SalesVoucher2', salesVoucherSchema);

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
  salesVoucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesVoucher2', // Optional reference to a SalesVoucher
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
    required: false, // Make it optional for cash returns
  },
  referenceNo: {
    type: String,
    unique: true,
    sparse: true // allow multiple nulls
  },
  date: {
    type: Date,
    required: true,
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
  }
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
  billNumber: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
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
  }
}, { timestamps: true });

// Create Purchase Return Voucher Model
const PurchaseReturnVoucher = mongoose.models.PurchaseReturnVoucher || mongoose.model('PurchaseReturnVoucher', purchaseReturnVoucherSchema);

// Define Contra Voucher Schema
const contraVoucherSchema = new mongoose.Schema({
  referenceNo: {
    type: String,
    required: true,
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
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  }
}, { timestamps: true });

// Add compound index for organization scoping
contraVoucherSchema.index({ referenceNo: 1, organization: 1 }, { unique: true });

const ContraVoucher = mongoose.models.ContraVoucher || mongoose.model('ContraVoucher', contraVoucherSchema);

// Define Journal Voucher Schema
const journalVoucherSchema = new mongoose.Schema({
  referenceNo: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  memo: {
    type: String,
    required: true,
  },
  transactions: [{
    account: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    }
  }],
  notes: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  }
}, { timestamps: true });

// Create compound index for unique reference number per organization
journalVoucherSchema.index({ referenceNo: 1, organization: 1 }, { unique: true });

const JournalVoucher = mongoose.models.JournalVoucher || mongoose.model('JournalVoucher', journalVoucherSchema);

// STUB: SalesOrder model
const SalesOrderSchema = new mongoose.Schema({}, { strict: false }); // Empty schema for now
export const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', SalesOrderSchema);

// Ledger Group Schema
const ledgerGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerGroup',
    default: null,
  },
  description: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, { timestamps: true });

// Create compound index for unique name per organization
ledgerGroupSchema.index({ name: 1, organization: 1 }, { unique: true });
ledgerGroupSchema.index({ code: 1, organization: 1 }, { unique: true });

const LedgerGroup = mongoose.models.LedgerGroup || mongoose.model('LedgerGroup', ledgerGroupSchema);

// Ledger Schema
const ledgerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerGroup',
    required: true,
  },
  description: {
    type: String,
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, { timestamps: true });

ledgerSchema.index({ name: 1, organization: 1 }, { unique: true });
ledgerSchema.index({ code: 1, organization: 1 }, { unique: true });

const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', ledgerSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// Unit Schema
const unitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });
const Unit = mongoose.models.Unit || mongoose.model('Unit', unitSchema);

export { 
  User, Organization, Role, Permission, Account, Transaction, TaxRate, 
  Item, Warehouse, StockEntry, Invoice, Payment, CreditNote, Document, 
  DocumentLink, ReportTemplate, ReportInstance, Supplier, PurchaseOrder, 
  PurchaseBill, Customer, SalesVoucher2, SalesBill, SalesReturnVoucher, 
  PurchaseReturnVoucher, ContraVoucher, JournalVoucher, ReceiptVoucher,
  LedgerGroup, Ledger, Category, Unit
};
