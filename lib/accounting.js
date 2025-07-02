'use server';

import { Book } from 'medici';
import mongoose from 'mongoose';
import Counter from './models/Counter';

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
    console.log('Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(mongoConnectionString, mongooseOptions);
    isConnected = true;
    console.log('Connected to MongoDB');
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
    } else if (memo.includes('Purchase Order')) {
      counterName = 'purchase_order';
      prefix = 'PO-';
    }
    else if (memo.includes('General Journal Voucher')) {
      counterName = 'journal_voucher';
      prefix = 'JV-';
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
          // Debug log for organizationId
          console.log('[DEBUG] Creating journal with organizationId:', opts.organizationId, 'Type:', typeof opts.organizationId);
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
          // Debug log for journal object
          console.log('[DEBUG] Journal object before save:', journal);
          
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
                  // Debug log for transaction document
                  console.log('[DEBUG] Transaction document to insert:', transactionDocument);
                  
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
      console.log('Creating Medici_Journal model');
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
      console.log('Creating Medici_Transaction model');
      // Use our predefined transaction schema
      transactionModel = mongoose.model('Medici_Transaction', TransactionSchema);
    }
    
    // Add book and organization filter if not specified
    const fullQuery = {
      ...query,
      organizationId: options.organizationId,
    };
    
    console.log('getJournalEntries fullQuery:', fullQuery);
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

// Function to create a journal voucher for a purchase order
async function createPurchaseEntry(purchaseOrder, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  
  // Create a simplified memo with just supplier name
  let memo = `Purchase Order from Supplier`;
  
  // If purchaseOrder has supplier info, add it to the memo
  if (purchaseOrder.supplier) {
    // If supplier is populated with the full object
    if (typeof purchaseOrder.supplier === 'object' && purchaseOrder.supplier.name) {
      memo = `Purchase Order from Supplier ${purchaseOrder.supplier.name}`;
    } else {
      // If it's just an ID, store it in meta for later resolution
      memo = `Purchase Order from Supplier ${purchaseOrder.supplier}`;
    }
  }
  
  const journal = await book.entry(memo, { organizationId, organizationName });
  journal.debit(standardizeAccountName('Assets:Inventory'), purchaseOrder.totalAmount, { 
    purchaseOrderId: purchaseOrder._id,
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
    supplierId: typeof purchaseOrder.supplier === 'object' ? purchaseOrder.supplier._id : purchaseOrder.supplier
  });
  journal.credit(standardizeAccountName('Liabilities:Accounts Payable'), purchaseOrder.totalAmount, { 
    purchaseOrderId: purchaseOrder._id,
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
    supplierId: typeof purchaseOrder.supplier === 'object' ? purchaseOrder.supplier._id : purchaseOrder.supplier
  });
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for a sales voucher
async function createSalesVoucherEntry(salesVoucher, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  
  // Create a simplified memo with just customer name
  let memo = `Sales Voucher to Customer`;
  
  // If salesVoucher has customer info, add it to the memo
  if (salesVoucher.customer) {
    // If customer is populated with the full object
    if (typeof salesVoucher.customer === 'object' && salesVoucher.customer.name) {
      memo = `Sales Voucher to Customer ${salesVoucher.customer.name}`;
    } else {
      // If it's just an ID, store it in meta for later resolution
      memo = `Sales Voucher to Customer ${salesVoucher.customer}`;
    }
  }
  
  const entry = await book.entry(memo, { organizationId, organizationName });
  entry.debit(standardizeAccountName('Assets:Accounts Receivable'), salesVoucher.totalAmount, { 
    salesVoucherId: salesVoucher._id,
    customerId: typeof salesVoucher.customer === 'object' ? salesVoucher.customer._id : salesVoucher.customer
  });
  entry.credit(standardizeAccountName('Income:Sales Revenue'), salesVoucher.totalAmount, { 
    salesVoucherId: salesVoucher._id,
    customerId: typeof salesVoucher.customer === 'object' ? salesVoucher.customer._id : salesVoucher.customer
  });
  const savedJournal = await entry.commit();
  console.log('Returning voucher number from createSalesVoucherEntry:', savedJournal.voucherNumber);
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
  const creditAccount = standardizeAccountName('Assets:Accounts Receivable');
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
  if (salesReturn.customer) {
    if (typeof salesReturn.customer === 'object' && salesReturn.customer.name) {
      memo = `Sales Return from Customer ${salesReturn.customer.name}`;
    } else {
      memo = `Sales Return from Customer ${salesReturn.customer}`;
    }
  }
  const journal = await book.entry(memo, { organizationId, organizationName });
  journal.debit(standardizeAccountName('Income:Sales Revenue'), salesReturn.totalAmount, {
    salesReturnId: salesReturn._id,
    referenceNo: salesReturn.referenceNo,
    customerId: typeof salesReturn.customer === 'object' ? salesReturn.customer._id : salesReturn.customer
  });
  journal.credit(standardizeAccountName('Assets:Accounts Receivable'), salesReturn.totalAmount, {
    salesReturnId: salesReturn._id,
    referenceNo: salesReturn.referenceNo,
    customerId: typeof salesReturn.customer === 'object' ? salesReturn.customer._id : salesReturn.customer
  });
  await journal.commit();
  return journal.voucherNumber;
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
      memo = `Purchase Return to Supplier ${purchaseReturn.supplier}`;
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
  await journal.commit();
  return journal.voucherNumber;
}

// Function to create a journal voucher for a contra voucher
async function createContraEntry(contraVoucher, organizationId, organizationName) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!organizationName) throw new Error('organizationName is required');
  const book = await getBook();
  const memo = `Contra Voucher`;
  const journal = await book.entry(memo, { organizationId, organizationName });
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