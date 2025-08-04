'use server';

import { Book } from 'medici';
import mongoose from 'mongoose';
import Counter from './models/Counter';

// Helper function to generate proper numeric account codes
async function generateAccountCode(accountType, orgId) {
  const ChartOfAccount = (await import('./models/ChartOfAccounts')).default;
  
  const codeRanges = {
    asset: { start: 1000, max: 1999 },
    liability: { start: 2000, max: 2999 },
    equity: { start: 3000, max: 3999 },
    revenue: { start: 4000, max: 4999 },
    expense: { start: 5000, max: 5999 }
  };
  
  const range = codeRanges[accountType] || codeRanges.asset;
  
  // Find the highest existing code for this account type and organization
  const existingAccounts = await ChartOfAccount.find({
    organization: orgId,
    type: accountType,
    code: { $regex: /^\d+$/ } // Only numeric codes
  }).sort({ code: -1 }).limit(1);
  
  let nextCode = range.start;
  if (existingAccounts.length > 0) {
    const lastCode = parseInt(existingAccounts[0].code);
    if (lastCode >= range.start && lastCode < range.max) {
      nextCode = lastCode + 1;
    }
  }
  
  // Ensure we don't exceed the range
  if (nextCode > range.max) {
    nextCode = range.start;
  }
  
  // Check if this code already exists globally (across all organizations)
  let codeExists = await ChartOfAccount.findOne({ code: nextCode.toString() });
  while (codeExists && nextCode <= range.max) {
    nextCode++;
    codeExists = await ChartOfAccount.findOne({ code: nextCode.toString() });
  }
  
  return nextCode.toString();
}

// Define your MongoDB connection string
const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

// MongoDB connection options
const mongooseOptions = {
  // Removed deprecated options
};

// Ensure a single MongoDB connection
let isConnected = false;

// Connect to MongoDB if not already connected
async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(mongoConnectionString, mongooseOptions);
    isConnected = true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Initialize Medici Book instance
let bookInstance = null;

// Define explicit transaction schema - Simple and clean
const TransactionSchema = new mongoose.Schema({
  _journal: { type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Journal' },
  datetime: { type: Date, default: Date.now },
  accounts: { type: String, required: true },
  book: { type: String, default: 'cloud_ledger' },
  memo: { type: String, default: '' },
  debit: { type: Boolean, required: true },
  credit: { type: Boolean, required: true },
  amount: { type: Number, required: true },
  voided: { type: Boolean, default: false },
  meta: { type: Object, default: {} },
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
}, { collection: 'medici_transactions' });

// Create an index on the amount field for better performance
TransactionSchema.index({ amount: 1 });

// Generate a voucher number based on the transaction type
async function generateVoucherNumber(memo, organization) {
  try {
    let counterName = 'journal_entry'; // Default counter
    let prefix = 'JV-';
    
    // Determine counter and prefix based on transaction type from memo
    if (memo.includes('Payment Received from Customer')) {
      counterName = 'receipt_voucher';
      prefix = 'RcV-';
    } else if (memo.includes('Payment Sent to Supplier')) {
      counterName = 'payment_voucher';
      prefix = 'PaV-';
    } else if (memo.includes('Expense:')) {
      counterName = 'expense_voucher';
      prefix = 'EV-';
    } else if (memo.includes('Other Income:')) {
      counterName = 'income_voucher';
      prefix = 'IV-';
    } else if (memo.includes('Sales Order')) {
      counterName = 'sales_order';
      prefix = 'SV-';
    } else if (memo.includes('Sales Voucher')) {
      counterName = 'sales_voucher';
      prefix = 'SV-';
    } else if (memo.includes('Purchase Order') || memo.includes('Purchase Voucher')) {
      counterName = 'purchase_voucher';
      prefix = 'PV-';
    }
    else if (memo.includes('General Journal Voucher')) {
      counterName = 'journal_voucher';
      prefix = 'JV-';
    } else if (memo.includes('Sales Return')) {
      counterName = 'sales_return_voucher';
      prefix = 'SR-';
    } else if (memo.includes('Purchase Return')) {
      counterName = 'purchase_return_voucher';
      prefix = 'PRV-';
    }
    if (!organization) throw new Error('Organization name is required for voucher numbering');
    // Get the next sequence number with the determined prefix, per organization
    return await Counter.getNextSequence(counterName, { prefix, organization });
  } catch (error) {
    console.error('Error generating voucher number:', error);
    throw error;
  }
}

// Get or create the book instance
async function getBook() {
  try {
    // Connect to the database first
    await connectToDatabase();
    
    // Create the book instance if it doesn't exist
    if (!bookInstance) {
      // Ensure the models exist
      // Always delete the model if it exists to avoid schema caching issues
      if (mongoose.models.Medici_Journal) {
        delete mongoose.models.Medici_Journal;
      }
      const journalModel = mongoose.models.Medici_Journal || 
        mongoose.model('Medici_Journal', new mongoose.Schema({
          datetime: Date,
          memo: String,
          voided: Boolean,
          void_reason: String,
          book: String,
          voucherNumber: String, // Add voucher number field
          _transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Transaction' }],
          organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        }, { collection: 'medici_journals' }));
      
      if (mongoose.models.Medici_Transaction) {
        delete mongoose.models.Medici_Transaction;
      }
      // Use our transaction schema
      const transactionModel = mongoose.models.Medici_Transaction ||
        mongoose.model('Medici_Transaction', TransactionSchema);
      
      // Create a robust implementation
      bookInstance = {
        entry: async (memo, opts = {}) => {
          if (!opts.organizationId) {
            throw new Error('organizationId is required for all accounting entries');
          }
          // Use provided voucherNumber if available and non-empty, otherwise generate
          const voucherNumber = (opts.voucherNumber !== undefined && opts.voucherNumber !== null && opts.voucherNumber !== '') 
            ? opts.voucherNumber 
            : await generateVoucherNumber(memo, opts.organizationName);
          const journal = new journalModel({
            datetime: new Date(),
            memo,
            voided: false,
            voucherNumber: voucherNumber,
            _transactions: [],
            organizationId: new mongoose.Types.ObjectId(opts.organizationId),
          });
          
          const transactions = [];
          
          // Determine if this is a journal voucher (default: only if explicitly set or memo contains 'Journal Voucher')
          const isJournalVoucher = opts.isJournalVoucher === true || /journal voucher/i.test(memo);
          
          return {
            debit: (account, amount, meta = {}) => {
              // Force number conversion
              const numAmount = Number(amount);
              
              // Just split the account string for storage
              const accountParts = account.split(':');
              
              // Only add voucherNumber to meta for journal vouchers
              const metaToStore = isJournalVoucher ? { ...meta, voucherNumber } : { ...meta };
              transactions.push({
                accounts: account,
                account_path: accountParts,
                debit: true,
                credit: false,
                amount: numAmount,
                memo,
                meta: metaToStore
              });
            },
            
            credit: (account, amount, meta = {}) => {
              // Force number conversion
              const numAmount = Number(amount);
              
              // Just split the account string for storage
              const accountParts = account.split(':');
              
              // Only add voucherNumber to meta for journal vouchers
              const metaToStore = isJournalVoucher ? { ...meta, voucherNumber } : { ...meta };
              transactions.push({
                accounts: account,
                account_path: accountParts,
                debit: false,
                credit: true,
                amount: numAmount,
                memo,
                meta: metaToStore
              });
            },
            
            commit: async () => {
              try {
                // Save journal voucher first
                await journal.save();
                
                // Get direct access to the MongoDB collection
                const db = mongoose.connection.db;
                const collection = db.collection('medici_transactions');
                
                for (const txn of transactions) {
                  // Create MongoDB document
                  const transactionDocument = {
                    _journal: journal._id,
                    datetime: new Date(),
                    accounts: txn.accounts,
                    memo: txn.memo || '',
                    debit: !!txn.debit,
                    credit: !!txn.credit,
                    amount: txn.amount,
                    voided: false,
                    meta: txn.meta || {},
                    organizationId: new mongoose.Types.ObjectId(opts.organizationId),
                  };
                  
                  // Insert directly into MongoDB
                  const result = await collection.insertOne(transactionDocument);
                  
                  // Save transaction ID to journal
                  journal._transactions.push(result.insertedId);
                }
                
                // Update journal with transaction references
                await journal.save();
                // Fetch the latest journal from the database to ensure all fields (like voucherNumber) are present
                const savedJournal = await journalModel.findById(journal._id);
                return savedJournal;
              } catch (error) {
                console.error('Error committing journal voucher:', error);
                throw error;
              }
            }
          };
        },
        
        // Add balance method to calculate account balance
        balance: async (query) => {
          try {
            const { account, endDate } = query;
            
            // Build the query for transactions
            const transactionQuery = {
              accounts: account,
              voided: false
            };
            
            // Add date filter if endDate is provided
            if (endDate) {
              transactionQuery.datetime = { $lte: new Date(endDate) };
            }
            
            // Get transactions from the database
            const transactions = await transactionModel.find(transactionQuery).lean();
            
            // Calculate balance
            let balance = 0;
            for (const tx of transactions) {
              if (tx.debit) {
                balance += tx.amount;
              } else if (tx.credit) {
                balance -= tx.amount;
              }
            }
            
            return { balance };
          } catch (error) {
            console.error('Error calculating balance:', error);
            return { balance: 0 };
          }
        },
        
        commit: async () => {
          try {
            // Save journal voucher first
            await journal.save();
            
            // Get direct access to the MongoDB collection
            const db = mongoose.connection.db;
            const collection = db.collection('medici_transactions');
            
            for (const txn of transactions) {
              // Create MongoDB document
              const transactionDocument = {
                _journal: journal._id,
                datetime: new Date(),
                accounts: txn.accounts,
                memo: txn.memo || '',
                debit: !!txn.debit,
                credit: !!txn.credit,
                amount: txn.amount,
                voided: false,
                meta: txn.meta || {},
                organizationId: new mongoose.Types.ObjectId(opts.organizationId),
              };
              
              // Insert directly into MongoDB
              const result = await collection.insertOne(transactionDocument);
              
              // Save transaction ID to journal
              journal._transactions.push(result.insertedId);
            }
            
            // Update journal with transaction references
            await journal.save();
            
            return journal;
          } catch (error) {
            console.error('Error committing journal voucher:', error);
            throw error;
          }
        }
      };
    }
    
    return bookInstance;
  } catch (error) {
    console.error('Error in getBook function:', error);
    throw error;
  }
}

// Define a more detailed chart of accounts
const accounts = {
  assets: ['Cash', 'Bank', 'Accounts Receivable', 'Inventory', 'Equipment', 'Vehicles'],
  liabilities: ['Accounts Payable', 'Loans'],
  income: ['Sales Revenue', 'Interest Income', 'Other Income'],
  expenses: ['Cost of Goods Sold', 'Rent Expense', 'Utilities Expense', 'Salaries Expense', 'Office Supplies Expense', 'Travel Expense'],
  equity: ["Owner's Equity", "Owner's Drawings"]
};

// Custom implementation of ledger function to replace book.ledger()
async function getJournalEntries(query = {}, options = {}) {
  await connectToDatabase();
  
  const page = options.page || 1;
  const perPage = options.perPage || 10;
  const skip = (page - 1) * perPage;
  
  if (!options.organizationId) {
    throw new Error('organizationId is required to fetch journal entries');
  }
  
  try {
    // Get the journal model
    let journalModel;
    try {
      journalModel = mongoose.model('Medici_Journal');
    } catch (modelError) {

      const journalSchema = new mongoose.Schema({
        datetime: Date,
        memo: String,
        voided: Boolean,
        void_reason: String,
        book: String,
        _transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Transaction' }],
        organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
      }, { collection: 'medici_journals' });
      
      journalModel = mongoose.model('Medici_Journal', journalSchema);
    }
    
    // Get the transaction model
    let transactionModel;
    try {
      transactionModel = mongoose.model('Medici_Transaction');
    } catch (modelError) {

      // Use our predefined transaction schema
      transactionModel = mongoose.model('Medici_Transaction', TransactionSchema);
    }
    
    // Add book and organization filter if not specified
    const fullQuery = {
      ...query,
      organizationId: options.organizationId,
    };
    
    // Get journals with pagination
    const journals = await journalModel
      .find(fullQuery)
      .sort({ datetime: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();
    
    // For each journal, fetch its transactions
    const journalEntries = await Promise.all(
      journals.map(async (journal) => {
        const transactions = await transactionModel
          .find({ _journal: journal._id })
          .lean();
        
        // Ensure all transaction amounts are properly formatted numbers
        const formattedTransactions = transactions.map(transaction => {
          // Convert amount to number
          let amount;
          try {
            amount = parseFloat(transaction.amount);
            if (isNaN(amount)) {
              console.error('Invalid amount found in transaction:', transaction._id, transaction.amount);
              amount = 0;
            }
          } catch (error) {
            console.error('Error parsing transaction amount:', error);
            amount = 0;
          }
          
          return {
            ...transaction,
            amount,
            account_path: Array.isArray(transaction.account_path) ? transaction.account_path : 
              (transaction.accounts ? transaction.accounts.split(':') : []),
            debit: !!transaction.debit,
            credit: !transaction.debit
          };
        });
        
        return {
          ...journal,
          transactions: formattedTransactions
        };
      })
    );
    
    return journalEntries;
  } catch (error) {
    console.error('Error in getJournalEntries:', error);
    throw error;
  }
}

// Helper function to standardize account names with proper capitalization
function standardizeAccountName(account) {
  if (!account) return '';
  

  
  // Split by colon to separate account categories
  const parts = account.split(':');
  
  // Capitalize first letter of each account category
  const standardized = parts.map(part => {
    if (!part) return '';
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(':');
  

  return standardized;
}

// Function to create a journal voucher for a purchase voucher
async function createPurchaseEntry(purchaseOrder, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  
  // Helper to ensure a ledger exists
  async function ensureLedger(path, orgId) {
    const Ledger = mongoose.models.Ledger || mongoose.model('Ledger');
    const ChartOfAccount = (await import('./models/ChartOfAccounts')).default;
    
    // Try to find by path and organization first
    let ledger = await Ledger.findOne({ path, organization: orgId });
    if (ledger) {
      return ledger;
    }
    
    // Try to find by name and organization (legacy ledgers)
    ledger = await Ledger.findOne({ name: path.split(':').slice(-1)[0], organization: orgId });
    if (ledger) {
      return ledger;
    }
    const LedgerGroup = mongoose.models.LedgerGroup || mongoose.model('LedgerGroup');
    // Try to find the group for the top-level path
    let groupName = path.split(':')[0];
    // If this is a supplier account, force group to 'Accounts Payable'
    if (/^Liabilities:Accounts Payable:/.test(path)) {
      groupName = 'Accounts Payable';
    }
    let group = await LedgerGroup.findOne({ name: groupName, organization: orgId });
    if (!group) {
      group = await LedgerGroup.create({ name: groupName, organization: orgId });
    }
    
    // --- NEW: Resolve ObjectId to name for last part of path ---
    let namePart = path.split(':').slice(-1)[0];
    if (typeof namePart === 'string' && namePart.length === 24 && /^[a-fA-F0-9]{24}$/.test(namePart)) {
      // Try supplier
      const Supplier = mongoose.models.Supplier || mongoose.model('Supplier');
      const supplierDoc = await Supplier.findOne({ _id: namePart, organization: orgId });
      if (supplierDoc && supplierDoc.name) {
        namePart = supplierDoc.name;
      } else {
        // Try item
        const Item = mongoose.models.Item || mongoose.model('Item');
        const itemDoc = await Item.findOne({ _id: namePart, organization: orgId });
        if (itemDoc && itemDoc.name) {
          namePart = itemDoc.name;
        }
      }
    }
    
    // Rebuild path with resolved name
    const pathParts = path.split(':');
    pathParts[pathParts.length - 1] = namePart;
    const resolvedPath = pathParts.join(':');
    
    // Check again for existing ledger with resolved path
    ledger = await Ledger.findOne({ path: resolvedPath, organization: orgId });
    if (ledger) {
      return ledger;
    }
    
    // NEW: Check for existing ledger by name and organization (regardless of path/group)
    ledger = await Ledger.findOne({ name: namePart, organization: orgId });
    if (ledger) {
      // Optionally update group/path if needed
      let needsUpdate = false;
      if (String(ledger.group) !== String(group._id)) {
        ledger.group = group._id;
        needsUpdate = true;
      }
      if (ledger.path !== resolvedPath) {
        ledger.path = resolvedPath;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await ledger.save();
      }
      return ledger;
    }
    
    // Create the ledger
    ledger = await Ledger.create({
      name: namePart,
      group: group._id,
      organization: orgId,
      path: resolvedPath
    });
    
    // ALSO create ChartOfAccount entry with the same path
    try {
      // Determine account type and subtype based on path
      let accountType = 'asset';
      let accountSubtype = 'current';
      // Generate proper numeric code using the helper function
        const code = await generateAccountCode(accountType, orgId);
      
      if (resolvedPath.startsWith('Liabilities:')) {
        accountType = 'liability';
        accountSubtype = 'current_liability';
      } else if (resolvedPath.startsWith('Revenue:') || resolvedPath.startsWith('Income:')) {
        accountType = 'revenue';
        accountSubtype = 'operating_revenue';
      } else if (resolvedPath.startsWith('Expenses:')) {
        accountType = 'expense';
        accountSubtype = 'operating_expense';
      } else if (resolvedPath.startsWith('Equity:')) {
        accountType = 'equity';
        accountSubtype = 'capital';
      }
      
      // Check if ChartOfAccount already exists by path first
      let chartAccount = await ChartOfAccount.findOne({ path: resolvedPath, organization: orgId });
      if (!chartAccount) {
        }
        
        chartAccount = await ChartOfAccount.create({
          code,
          name: namePart,
          type: accountType,
          subtype: accountSubtype,
          path: resolvedPath,
          organization: orgId,
          active: true
        });
      } catch (error) {
      // Don't fail the ledger creation if ChartOfAccount creation fails
      console.error('Error creating ChartOfAccount:', error);
    }
    
    return ledger;
  }

  // Determine credit account (Accounts Payable with supplier name)
  let memo = `Purchase Voucher from Supplier`;
  let creditAccount = '';
  let supplierName = '';
  
  // Helper to get supplier name from ObjectId
  async function getSupplierName(supplierId) {
    if (!supplierId) throw new Error('No supplierId provided to getSupplierName');
    // Handle MongoDB ObjectId objects
    if (typeof supplierId === 'object' && (supplierId._bsontype === 'ObjectId' || supplierId._bsontype === 'ObjectID')) {
      supplierId = supplierId.toString();
    }
    if (typeof supplierId === 'string' && supplierId.length === 24) {
      const Supplier = mongoose.models.Supplier || mongoose.model('Supplier');
      const supplierDoc = await Supplier.findById(supplierId);
      if (supplierDoc && supplierDoc.name) return supplierDoc.name;
      throw new Error(`Supplier not found for ID: ${supplierId}`);
    }
    if (typeof supplierId === 'object' && supplierId.name) return supplierId.name;
    throw new Error('Invalid supplierId provided to getSupplierName');
  }
  
  // Helper to get item name from ObjectId
  async function getItemName(itemId) {
    if (!itemId) return '';
    if (typeof itemId === 'string' && itemId.length === 24) {
      const Item = mongoose.models.Item || mongoose.model('Item');
      const itemDoc = await Item.findById(itemId);
      if (itemDoc && itemDoc.name) return itemDoc.name;
    }
    return itemId.name || itemId.toString();
  }

  if (purchaseOrder.supplier) {
    // Always resolve supplier name from ID
    supplierName = await getSupplierName(purchaseOrder.supplier);
    if (!supplierName) {
      throw new Error('Could not resolve supplier name for purchase voucher.');
    }

    // Use the exact supplierName for all paths
    memo = `Purchase Voucher from Supplier ${supplierName}`;
    creditAccount = `Liabilities:Accounts Payable:${supplierName}`;
    
    await ensureLedger(creditAccount, organizationId);
  }

  // For each item, ensure item ledger exists and debit it
  const items = purchaseOrder.items || [];
  const entry = await book.entry(memo, { organizationId, organizationName });
  let totalAmount = 0;
  
  // Import models for stock tracking
  const StockEntry = mongoose.models.StockEntry || mongoose.model('StockEntry');
  const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse');
  
  for (const item of items) {
    const itemName = await getItemName(item.item) || item.itemName || item.productName || item.name || 'Unknown Item';
    const itemLedgerPath = `Inventory:${itemName}`;

    await ensureLedger(itemLedgerPath, organizationId);
    const amount = item.price && item.quantity ? Number(item.price) * Number(item.quantity) : 0;
    const quantity = Number(item.quantity) || 0;
    
    if (amount > 0) {
      // Debit the item ledger (inventory increase)
      entry.debit(standardizeAccountName(itemLedgerPath), amount, {
        purchaseVoucherId: purchaseOrder._id,
        itemId: item.item,
        itemName: itemName
      });
      totalAmount += amount;
      
      // Update stock quantity (increase for purchases)
      if (quantity > 0 && item.item) {
        try {
          // Find default warehouse
          let defaultWarehouse = await Warehouse.findOne({ 
            name: 'Main Warehouse', 
            organization: organizationId 
          });
          
          if (!defaultWarehouse) {
            defaultWarehouse = await Warehouse.create({
              name: 'Main Warehouse',
              location: 'Default Location',
              organization: organizationId
            });
          }

          // Create positive stock entry for purchases (stock increase)
          await StockEntry.create({
            item: item.item,
            warehouse: defaultWarehouse._id,
            quantity: quantity, // Positive for stock increase
            date: new Date(),
            organization: organizationId,
            // Add metadata to identify this as a purchase transaction
            transactionType: 'purchase',
            referenceId: purchaseOrder._id,
            referenceType: 'PurchaseVoucher'
          });
          
        } catch (stockError) {
          // Don't fail the entire transaction for stock errors
        }
      }
    }
  }
  
  // Credit the total to Accounts Payable with supplier name
  const standardizedCreditAccount = standardizeAccountName(creditAccount);
  
  entry.credit(standardizedCreditAccount, totalAmount, {
    purchaseVoucherId: purchaseOrder._id,
    supplierId: typeof purchaseOrder.supplier === 'object' ? purchaseOrder.supplier._id : purchaseOrder.supplier
  });

  const savedJournal = await entry.commit();
  return savedJournal.voucherNumber;
}

// Function to create a journal voucher for a sales voucher
async function createSalesVoucherEntry(salesVoucher, organizationId, organizationName) {

  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  
  // Helper to ensure a ledger exists
  async function ensureLedger(path, orgId) {
    const Ledger = mongoose.models.Ledger || mongoose.model('Ledger');
    const ChartOfAccount = (await import('./models/ChartOfAccounts')).default;
    
    // Try to find by path and organization first
    let ledger = await Ledger.findOne({ path, organization: orgId });
    if (ledger) {

      return ledger;
    }
    
    // Try to find by name and organization (legacy ledgers)
    ledger = await Ledger.findOne({ name: path.split(':').slice(-1)[0], organization: orgId });
    if (ledger) {

      return ledger;
    }
    const LedgerGroup = mongoose.models.LedgerGroup || mongoose.model('LedgerGroup');
    // Try to find the group for the top-level path
    let groupName = path.split(':')[0];
    // If this is a customer account, force group to 'Accounts Receivable'
    if (/^Assets:Accounts Receivable:/.test(path)) {
      groupName = 'Accounts Receivable';
    }
    let group = await LedgerGroup.findOne({ name: groupName, organization: orgId });
    if (!group) {
      group = await LedgerGroup.create({ name: groupName, organization: orgId });

    }
    
    // --- NEW: Resolve ObjectId to name for last part of path ---
    let namePart = path.split(':').slice(-1)[0];
    if (typeof namePart === 'string' && namePart.length === 24 && /^[a-fA-F0-9]{24}$/.test(namePart)) {
      // Try customer
      const Customer = mongoose.models.Customer || mongoose.model('Customer');
      const customerDoc = await Customer.findOne({ _id: namePart, organization: orgId });
      if (customerDoc && customerDoc.name) {
        namePart = customerDoc.name;
      } else {
        // Try item
        const Item = mongoose.models.Item || mongoose.model('Item');
        const itemDoc = await Item.findOne({ _id: namePart, organization: orgId });
        if (itemDoc && itemDoc.name) {
          namePart = itemDoc.name;
        }
      }
    }
    
    // Rebuild path with resolved name
    const pathParts = path.split(':');
    pathParts[pathParts.length - 1] = namePart;
    const resolvedPath = pathParts.join(':');
    
    // Check again for existing ledger with resolved path
    ledger = await Ledger.findOne({ path: resolvedPath, organization: orgId });
    if (ledger) {

      return ledger;
    }
    
    // NEW: Check for existing ledger by name and organization (regardless of path/group)
    ledger = await Ledger.findOne({ name: namePart, organization: orgId });
    if (ledger) {
      // Optionally update group/path if needed
      let needsUpdate = false;
      if (String(ledger.group) !== String(group._id)) {
        ledger.group = group._id;
        needsUpdate = true;
      }
      if (ledger.path !== resolvedPath) {
        ledger.path = resolvedPath;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await ledger.save();

      } else {

      }
      return ledger;
    }
    
    // Create the ledger
    ledger = await Ledger.create({
      name: namePart,
      group: group._id,
      organization: orgId,
      path: resolvedPath
    });

    
    // ALSO create ChartOfAccount entry with the same path
    try {
      // Determine account type and subtype based on path
      let accountType = 'asset';
      let accountSubtype = 'current';
      // Generate proper numeric code using the helper function
        const code = await generateAccountCode(accountType, orgId);
      
      if (resolvedPath.startsWith('Liabilities:')) {
        accountType = 'liability';
        accountSubtype = 'current_liability';
      } else if (resolvedPath.startsWith('Revenue:') || resolvedPath.startsWith('Income:')) {
        accountType = 'revenue';
        accountSubtype = 'operating_revenue';
      } else if (resolvedPath.startsWith('Expenses:')) {
        accountType = 'expense';
        accountSubtype = 'operating_expense';
      } else if (resolvedPath.startsWith('Equity:')) {
        accountType = 'equity';
        accountSubtype = 'capital';
      }
      
      // Check if ChartOfAccount already exists by path first
      let chartAccount = await ChartOfAccount.findOne({ path: resolvedPath, organization: orgId });
      if (!chartAccount) {
        }
        
        chartAccount = await ChartOfAccount.create({
          code,
          name: namePart,
          type: accountType,
          subtype: accountSubtype,
          path: resolvedPath,
          organization: orgId,
          active: true
        });
      } catch (error) {
      // Don't fail the ledger creation if ChartOfAccount creation fails
      console.error('Error creating ChartOfAccount:', error);
    }
    
    return ledger;
  }

  // Determine debit account (Cash or Customer)
  let memo = `Sales Voucher to Customer`;
  let debitAccount = '';
  let customerName = '';
  // Helper to get customer name from ObjectId
  async function getCustomerName(customerId) {
    if (!customerId) throw new Error('No customerId provided to getCustomerName');
    // Handle MongoDB ObjectId objects
    if (typeof customerId === 'object' && (customerId._bsontype === 'ObjectId' || customerId._bsontype === 'ObjectID')) {
      customerId = customerId.toString();
    }
    if (typeof customerId === 'string' && customerId.length === 24) {
      const Customer = mongoose.models.Customer || mongoose.model('Customer');
      const customerDoc = await Customer.findById(customerId);
      if (customerDoc && customerDoc.name) return customerDoc.name;
      throw new Error(`Customer not found for ID: ${customerId}`);
    }
    if (typeof customerId === 'object' && customerId.name) return customerId.name;
    throw new Error('Invalid customerId provided to getCustomerName');
  }
  // Helper to get item name from ObjectId
  async function getItemName(itemId) {
    if (!itemId) return '';
    if (typeof itemId === 'string' && itemId.length === 24) {
      const Item = mongoose.models.Item || mongoose.model('Item');
      const itemDoc = await Item.findById(itemId);
      if (itemDoc && itemDoc.name) return itemDoc.name;
    }
    return itemId.name || itemId.toString();
  }
  if (salesVoucher.customer === 'CASH' || salesVoucher.customerName === 'CASH' || salesVoucher.isCashSale) {
    memo = `Sales Voucher (Cash)`;
    debitAccount = 'Assets:Cash';

    await ensureLedger(debitAccount, organizationId);
  } else if (salesVoucher.customer) {
    // Always resolve customer name from ID
    customerName = await getCustomerName(salesVoucher.customer);
    if (!customerName) {
      throw new Error('Could not resolve customer name for sales voucher.');
    }

    // In createSalesVoucherEntry, after resolving customerName:
    // Use the exact customerName for all paths
    memo = `Sales Voucher to Customer ${customerName}`;
    debitAccount = `Assets:Accounts Receivable:${customerName}`;
    // When calling ensureLedger and creating ChartOfAccount, always use debitAccount (with exact customerName)

    await ensureLedger(debitAccount, organizationId);
  }

  // Always ensure the credit ledger exists
  const creditAccount = 'Income:Sales Revenue';

  await ensureLedger(creditAccount, organizationId);

  // For each item, ensure item ledger exists and credit it, and also credit sales revenue
  const items = salesVoucher.items || [];
  const entry = await book.entry(memo, { organizationId, organizationName });
  let totalAmount = 0;
  
  // Import models for stock tracking
  const StockEntry = mongoose.models.StockEntry || mongoose.model('StockEntry');
  const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse');
  
  for (const item of items) {
    const itemName = await getItemName(item.item) || item.itemName || item.productName || item.name || 'Unknown Item';
    const itemLedgerPath = `Inventory:${itemName}`;

    await ensureLedger(itemLedgerPath, organizationId);
    const amount = item.price && item.quantity ? Number(item.price) * Number(item.quantity) : 0;
    const quantity = Number(item.quantity) || 0;
    
    if (amount > 0) {
      // Credit the item ledger (inventory decrease)
      entry.credit(standardizeAccountName(itemLedgerPath), amount, {
        salesVoucherId: salesVoucher._id,
        itemId: item.item,
        itemName: itemName
      });
      // Credit sales revenue
      entry.credit(standardizeAccountName(creditAccount), amount, {
        salesVoucherId: salesVoucher._id,
        itemId: item.item,
        itemName: itemName
      });
      totalAmount += amount;
      
      // Update stock quantity (decrease for sales)
      if (quantity > 0 && item.item) {
        try {
          // Find default warehouse
          let defaultWarehouse = await Warehouse.findOne({ 
            name: 'Main Warehouse', 
            organization: organizationId 
          });
          
          if (!defaultWarehouse) {
            defaultWarehouse = await Warehouse.create({
              name: 'Main Warehouse',
              location: 'Default Location',
              organization: organizationId
            });
          }

          // Create negative stock entry for sales (stock decrease)
          await StockEntry.create({
            item: item.item,
            warehouse: defaultWarehouse._id,
            quantity: -quantity, // Negative for stock decrease
            date: new Date(),
            organization: organizationId,
            // Add metadata to identify this as a sales transaction
            transactionType: 'sales',
            referenceId: salesVoucher._id,
            referenceType: 'SalesVoucher'
          });
          

        } catch (stockError) {
          // Don't fail the entire transaction for stock errors
        }
      }
    }
  }
  // Debit the total to Cash or Customer

  const standardizedDebitAccount = standardizeAccountName(debitAccount);

  entry.debit(standardizedDebitAccount, totalAmount, {
    salesVoucherId: salesVoucher._id,
    customerId: typeof salesVoucher.customer === 'object' ? salesVoucher.customer._id : salesVoucher.customer
  });

  const savedJournal = await entry.commit();

  return savedJournal.voucherNumber;
}

// Function to create a journal voucher for receiving payment from a customer
async function createPaymentReceivedEntry(paymentDetails, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');

  const book = await getBook();
  // Use customerName in memo if available
  let memo = `Payment Received from Customer`;
  if (paymentDetails.customerName) {
    memo += ` ${paymentDetails.customerName}`;
  } else if (paymentDetails.customerId) {
    memo += ` ${paymentDetails.customerId}`;
  }
  if (paymentDetails.receiptVoucherNumber) {
    memo += ` for Receipt Voucher ${paymentDetails.receiptVoucherNumber}`;
  }
  // Pass the voucher number to the book entry
  const journal = await book.entry(memo, { voucherNumber: paymentDetails.receiptVoucherNumber, organizationId, organizationName });
  // Always use standardizeAccountName for account fields
  const debitAccount = standardizeAccountName(`Assets:${paymentDetails.paymentMethod}`);
  // Include customer name in the credit account path to match the sales voucher entries
  const creditAccount = standardizeAccountName(`Assets:Accounts Receivable:${paymentDetails.customerName}`);


  journal.debit(debitAccount, paymentDetails.amount, {
    customerId: paymentDetails.customerId,
    customerName: paymentDetails.customerName,
    paymentMethod: paymentDetails.paymentMethod,
    receiptVoucherNumber: paymentDetails.receiptVoucherNumber,
    receiptVoucherId: paymentDetails._id
  });
  journal.credit(creditAccount, paymentDetails.amount, {
    customerId: paymentDetails.customerId,
    customerName: paymentDetails.customerName,
    paymentMethod: paymentDetails.paymentMethod,
    receiptVoucherNumber: paymentDetails.receiptVoucherNumber,
    receiptVoucherId: paymentDetails._id
  });
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for paying a supplier
async function createPaymentSentEntry(paymentDetails, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  // Create a more descriptive memo including bill number if available
  let memo = `Payment Sent to Supplier ${paymentDetails.supplierId}`;
  if (paymentDetails.billNumber) {
    memo += ` for Bill ${paymentDetails.billNumber}`;
  }
  // Pass the voucher number if available
  const journal = await book.entry(memo, { voucherNumber: paymentDetails.paymentVoucherNumber, organizationId, organizationName });
  journal.debit(standardizeAccountName('Liabilities:Accounts Payable'), paymentDetails.amount, { 
    supplierId: paymentDetails.supplierId, 
    billNumber: paymentDetails.billNumber,
    paymentVoucherId: paymentDetails._id
  });
  journal.credit(standardizeAccountName(`Assets:${paymentDetails.paymentMethod}`), paymentDetails.amount, { 
    supplierId: paymentDetails.supplierId, 
    billNumber: paymentDetails.billNumber,
    paymentVoucherId: paymentDetails._id
  });
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for recording an expense
async function createExpenseEntry(expenseDetails, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  // Create a clearer, more readable memo
  const memo = `Expense: ${expenseDetails.description || expenseDetails.expenseType || 'General Expense'}`;
  
  const journal = await book.entry(memo, { organizationId, organizationName });
  journal.debit(standardizeAccountName(`Expenses:${expenseDetails.expenseType || 'General'}`), expenseDetails.amount, { 
    expenseId: expenseDetails._id, 
    description: expenseDetails.description 
  });
  
  // Determine the credit account based on payment method
  let creditAccount = '';
  if (expenseDetails.paymentMethod === 'Credit') {
    creditAccount = standardizeAccountName('Liabilities:Accounts Payable');
  } else {
    creditAccount = standardizeAccountName(`Assets:${expenseDetails.paymentMethod || 'Cash'}`);
  }
  
  journal.credit(creditAccount, expenseDetails.amount, { 
    expenseId: expenseDetails._id, 
    description: expenseDetails.description 
  });
  
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for recording other income
async function createOtherIncomeEntry(incomeDetails, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  // Create a clearer, more readable memo
  const memo = `Other Income: ${incomeDetails.description || incomeDetails.incomeType || 'General Income'}`;
  
  const journal = await book.entry(memo, { organizationId, organizationName });
  journal.debit(standardizeAccountName(`Assets:${incomeDetails.receiptMethod || 'Cash'}`), incomeDetails.amount, { 
    incomeId: incomeDetails._id, 
    description: incomeDetails.description 
  });
  journal.credit(standardizeAccountName(`Income:${incomeDetails.incomeType || 'Other Income'}`), incomeDetails.amount, { 
    incomeId: incomeDetails._id, 
    description: incomeDetails.description 
  });
  
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for a sales return
async function createSalesReturnEntry(salesReturn, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');

  
  const book = await getBook();
  let memo = `Sales Return from Customer`;
  let customerName = '';
  
  // Resolve customer name
  if (salesReturn.customer) {
    if (typeof salesReturn.customer === 'object' && salesReturn.customer.name) {
      customerName = salesReturn.customer.name;
      memo = `Sales Return from Customer ${customerName}`;
    } else {
      // If it's just an ID, fetch the customer name from the DB
      const Customer = mongoose.models.Customer;
      if (Customer && mongoose.Types.ObjectId.isValid(salesReturn.customer)) {
        const customerDoc = await Customer.findById(salesReturn.customer).lean();
        if (customerDoc && customerDoc.name) {
          customerName = customerDoc.name;
          memo = `Sales Return from Customer ${customerName}`;
        } else {
          customerName = salesReturn.customer.toString();
          memo = `Sales Return from Customer ${customerName}`;
        }
      } else {
        customerName = salesReturn.customer.toString();
        memo = `Sales Return from Customer ${customerName}`;
      }
    }
  }
  
  if (!customerName) {
    throw new Error('Could not resolve customer name for sales return.');
  }
  

  
  const journal = await book.entry(memo, { organizationId, organizationName });
  
  // Sales return accounting:
  // Debit: Income:Sales Revenue (reduces sales revenue)
  // Credit: Assets:Accounts Receivable:CustomerName (reduces what customer owes us)
  const debitAccount = standardizeAccountName('Income:Sales Revenue');
  const creditAccount = standardizeAccountName(`Assets:Accounts Receivable:${customerName}`);
  


  
  journal.debit(debitAccount, salesReturn.totalAmount, {
    salesReturnId: salesReturn._id,
    referenceNo: salesReturn.referenceNo,
    customerId: typeof salesReturn.customer === 'object' ? salesReturn.customer._id : salesReturn.customer
  });
  
  journal.credit(creditAccount, salesReturn.totalAmount, {
    salesReturnId: salesReturn._id,
    referenceNo: salesReturn.referenceNo,
    customerId: typeof salesReturn.customer === 'object' ? salesReturn.customer._id : salesReturn.customer
  });

  // Handle stock entries for returned items
  const StockEntry = mongoose.models.StockEntry || mongoose.model('StockEntry');
  const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse');
  
  // Get default warehouse
  let defaultWarehouse = await Warehouse.findOne({
    organization: organizationId,
    name: 'Main Warehouse'
  });
  
  if (!defaultWarehouse) {
    defaultWarehouse = await Warehouse.create({
      name: 'Main Warehouse',
      location: 'Default Location',
      organization: organizationId
    });
  }

  // Process returned items and create stock entries
  const items = salesReturn.items || [];
  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    
    if (quantity > 0) {
      try {
        // Create positive stock entry for sales return (stock increase)
        await StockEntry.create({
          item: item.item,
          warehouse: defaultWarehouse._id,
          quantity: quantity, // Positive for stock increase
          date: new Date(),
          organization: organizationId,
          transactionType: 'sales_return',
          referenceId: salesReturn._id,
          referenceType: 'SalesReturnVoucher'
        });
      } catch (stockError) {
        // Don't fail the entire transaction for stock errors
      }
    }
  }
  
  const savedJournal = await journal.commit();

  return savedJournal.voucherNumber;
}

// Function to create a journal voucher for a purchase return
async function createPurchaseReturnEntry(purchaseReturn, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  let memo = `Purchase Return to Supplier`;
  if (purchaseReturn.supplier) {
    if (typeof purchaseReturn.supplier === 'object' && purchaseReturn.supplier.name) {
      memo = `Purchase Return to Supplier ${purchaseReturn.supplier.name}`;
    } else {
      // If it's just an ID, fetch the supplier name from the DB
      const Supplier = mongoose.models.Supplier;
      if (Supplier && mongoose.Types.ObjectId.isValid(purchaseReturn.supplier)) {
        const supplierDoc = await Supplier.findById(purchaseReturn.supplier).lean();
        if (supplierDoc && supplierDoc.name) {
          memo = `Purchase Return to Supplier ${supplierDoc.name}`;
        } else {
          memo = `Purchase Return to Supplier ${purchaseReturn.supplier}`;
        }
      } else {
        memo = `Purchase Return to Supplier ${purchaseReturn.supplier}`;
      }
    }
  }
  const journal = await book.entry(memo, { organizationId, organizationName });
  journal.credit(standardizeAccountName('Assets:Inventory'), purchaseReturn.totalAmount, {
    purchaseReturnId: purchaseReturn._id,
    referenceNo: purchaseReturn.referenceNo,
    supplierId: typeof purchaseReturn.supplier === 'object' ? purchaseReturn.supplier._id : purchaseReturn.supplier
  });
  journal.debit(standardizeAccountName('Liabilities:Accounts Payable'), purchaseReturn.totalAmount, {
    purchaseReturnId: purchaseReturn._id,
    referenceNo: purchaseReturn.referenceNo,
    supplierId: typeof purchaseReturn.supplier === 'object' ? purchaseReturn.supplier._id : purchaseReturn.supplier
  });
  const savedJournal = await journal.commit();
  return savedJournal.voucherNumber;
}

// Function to create a journal voucher for a contra voucher
async function createContraEntry(contraVoucher, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  const memo = `Contra Voucher`;
  // Use the contra voucher's referenceNo as the voucherNumber
  const journal = await book.entry(memo, { voucherNumber: contraVoucher.referenceNo, organizationId, organizationName });
  journal.credit(standardizeAccountName(contraVoucher.fromAccount), contraVoucher.amount, { contraVoucherId: contraVoucher._id });
  journal.debit(standardizeAccountName(contraVoucher.toAccount), contraVoucher.amount, { contraVoucherId: contraVoucher._id });
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal entry from a journal voucher
async function createJournalEntry(journalVoucher, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  const journal = await book.entry(journalVoucher.memo, { voucherNumber: journalVoucher.referenceNo, organizationId, organizationName });

  for (const transaction of journalVoucher.transactions) {
    if (transaction.type === 'debit') {
      journal.debit(standardizeAccountName(transaction.account), transaction.amount, { journalVoucherId: journalVoucher._id });
    } else {
      journal.credit(standardizeAccountName(transaction.account), transaction.amount, { journalVoucherId: journalVoucher._id });
    }
  }

  await journal.commit();
  return journal.voucherNumber;
}

// STUB: Owner Investment Entry
export async function createOwnerInvestmentEntry(data) {
  // TODO: Implement actual logic
  return { success: true, message: "Stub: Owner investment entry created." };
}

// STUB: Owner Drawings Entry
export async function createOwnerDrawingsEntry(data) {
  // TODO: Implement actual logic
  return { success: true, message: "Stub: Owner drawings entry created." };
}

// STUB: SalesOrder model
const SalesOrderSchema = new mongoose.Schema({}, { strict: false }); // Empty schema for now
export const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', SalesOrderSchema);

export {
  getBook,
  getJournalEntries,
  createPurchaseEntry,
  createSalesVoucherEntry,
  createPaymentReceivedEntry,
  createPaymentSentEntry,
  createExpenseEntry,
  createOtherIncomeEntry,
  createSalesReturnEntry,
  createPurchaseReturnEntry,
  createContraEntry,
  connectToDatabase,
  generateVoucherNumber,
  createJournalEntry
};
