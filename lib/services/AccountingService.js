import { Book } from 'medici';
import mongoose from 'mongoose';
import dbConnect from '../dbConnect';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';
import Employee from '../models/Employee';
import ChartOfAccount from '../models/ChartOfAccounts';
import Counter from '../models/Counter';

class AccountingService {
  constructor() {
    this.book = null;
    this.initialized = false;
    this._pendingOperations = [];
  }

  async init() {
    if (this.initialized) return;
    
    // Connect to the database
    await dbConnect();
    
    // Define our custom models for journals and transactions if they don't already exist
    // Use unique names to avoid conflicts with existing models
    if (!mongoose.models.AccountingJournal) {
      mongoose.model('AccountingJournal', new mongoose.Schema({
        datetime: { type: Date, default: Date.now },
        memo: String,
        book: { type: String, default: 'cloud_ledger' },
        voucherNumber: String,
        organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        meta: { type: Object, default: {} }
      }, { collection: 'accounting_journals' }));
    }
    
    if (!mongoose.models.AccountingTransaction) {
      mongoose.model('AccountingTransaction', new mongoose.Schema({
        journal: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingJournal' },
        datetime: { type: Date, default: Date.now },
        account_path: { type: String, required: true }, // Renamed from account to avoid conflicts
        debit: { type: Boolean, default: false },
        credit: { type: Boolean, default: false },
        amount: { type: Number, required: true },
        organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        meta: { type: Object, default: {} }
      }, { collection: 'accounting_transactions' }));
    }
    
    // Create a custom book implementation
    this.book = {
      entry: (memo, meta = {}) => {
        // Find organization ID from meta or use a default (first organization found)
        const getOrganizationId = async () => {
          if (meta.organizationId) return meta.organizationId;
          
          // If no organization ID provided, try to find the first organization
          const Organization = mongoose.models.Organization;
          if (Organization) {
            const org = await Organization.findOne();
            if (org) return org._id;
          }
          
          // If we still don't have an organization, throw an error
          throw new Error('Organization is required but not provided');
        };
        
        // Create journal entry function
        return {
          debit: (account, amount, entryMeta = {}) => {
            // Store the operation for later execution during commit
            if (!this._pendingOperations) this._pendingOperations = [];
            this._pendingOperations.push({
              type: 'debit',
              account,
              amount: Number(amount),
              meta: entryMeta
            });
          },
          
          credit: (account, amount, entryMeta = {}) => {
            // Store the operation for later execution during commit
            if (!this._pendingOperations) this._pendingOperations = [];
            this._pendingOperations.push({
              type: 'credit',
              account,
              amount: Number(amount),
              meta: entryMeta
            });
          },
          
          commit: async () => {
            try {
              // Get organization ID for this entry
              const organizationId = await getOrganizationId();
              
              // Create the journal
              const journal = new mongoose.models.AccountingJournal({
                datetime: meta.date || new Date(),
                memo,
                book: 'cloud_ledger',
                voucherNumber: meta.voucherNumber,
                organization: organizationId,
                meta
              });
              
              // Save the journal
              await journal.save();
              
              // Process all pending operations
              if (this._pendingOperations && this._pendingOperations.length > 0) {
                for (const op of this._pendingOperations) {
                  const transaction = new mongoose.models.AccountingTransaction({
                    journal: journal._id,
                    datetime: journal.datetime,
                    account_path: op.account,
                    debit: op.type === 'debit',
                    credit: op.type === 'credit',
                    amount: op.amount,
                    organization: organizationId,
                    meta: op.meta
                  });
                  
                  await transaction.save();
                }
                
                // Clear pending operations
                this._pendingOperations = [];
              }
              
              return journal;
            } catch (error) {
              console.error('Error committing transaction:', error);
              throw error;
            }
          }
        };
      },
      
      // Add balance method to our custom book
      balance: async (query) => {
        const transactions = await mongoose.models.AccountingTransaction.find({
          account_path: query.account,
          voided: false
        });
        
        let balance = 0;
        
        for (const txn of transactions) {
          if (txn.debit) {
            balance += txn.amount;
          } else if (txn.credit) {
            balance -= txn.amount;
          }
        }
        
        return balance;
      },
      
      // Add ledger method to our custom book
      ledger: async (query) => {
        const { account, start, end, limit = 100, skip = 0 } = query;
        
        // Build the query object
        const txnQuery = { account_path: account, voided: false };
        
        if (start || end) {
          txnQuery.datetime = {};
          if (start) txnQuery.datetime.$gte = new Date(start);
          if (end) txnQuery.datetime.$lte = new Date(end);
        }
        
        // Get transactions
        const transactions = await mongoose.models.AccountingTransaction.find(txnQuery)
          .sort({ datetime: -1 })
          .skip(skip)
          .limit(limit)
          .populate('journal')
          .lean();
        
        return transactions.map(txn => ({
          _id: txn._id,
          datetime: txn.datetime,
          account: txn.account_path,
          debit: txn.debit,
          credit: txn.credit,
          amount: txn.amount,
          memo: txn.journal?.memo || '',
          meta: txn.meta
        }));
      }
    };
    
    this.initialized = true;
    
    // Ensure chart of accounts exists
    await this.ensureChartOfAccounts();
  }

  async ensureChartOfAccounts() {
    // Check if chart of accounts is already populated
    const count = await ChartOfAccount.countDocuments();
    if (count === 0) {
      // Create default chart of accounts
      await ChartOfAccount.createDefaultAccounts();
    }
  }

  async createSubledgerAccount(entityType, entityId) {
    try {
      await this.init();
      
      let entity;
      let accountPath;
      
      // Get the entity and determine its ledger path
      switch (entityType) {
        case 'customer':
          entity = await Customer.findOne({ customerId: entityId });
          if (!entity) throw new Error(`Customer ${entityId} not found`);
          // Get ledger path directly as a string
          accountPath = `Assets:Current Assets:Accounts Receivable:${entity.name}`;
          break;
        
        case 'supplier':
          entity = await Supplier.findOne({ supplierId: entityId });
          if (!entity) throw new Error(`Supplier ${entityId} not found`);
          // Get ledger path directly as a string
          accountPath = `Liabilities:Current Liabilities:Accounts Payable:${entity.name}`;
          break;
        
        case 'employee':
          entity = await Employee.findOne({ employeeId: entityId });
          if (!entity) throw new Error(`Employee ${entityId} not found`);
          // Get ledger path directly as a string
          accountPath = `Expenses:Salaries and Wages:${entity.name}`;
          break;
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      

      
      // Check if account already exists in chart of accounts
      const existingAccount = await ChartOfAccount.findOne({ path: accountPath });
      if (existingAccount) {

        return existingAccount;
      }
      
      // Determine parent account based on entity type
      let parentCode, parentPath, accountType, accountSubtype;
      
      switch (entityType) {
        case 'customer':
          parentCode = '1120'; // Accounts Receivable
          parentPath = 'Assets:Current Assets:Accounts Receivable';
          accountType = 'asset';
          accountSubtype = 'current';
          break;
        
        case 'supplier':
          parentCode = '2110'; // Accounts Payable
          parentPath = 'Liabilities:Current Liabilities:Accounts Payable';
          accountType = 'liability';
          accountSubtype = 'current_liability';
          break;
        
        case 'employee':
          parentCode = '5200'; // Salaries and Wages
          parentPath = 'Expenses:Salaries and Wages';
          accountType = 'expense';
          accountSubtype = 'operating_expense';
          break;
      }
      
      // Generate a unique code for this subledger account
      const lastAccount = await ChartOfAccount.findOne({ parent: parentCode })
        .sort({ code: -1 });
      
      let newCode;
      if (lastAccount) {
        // Increment the last code
        const lastCodeNumber = parseInt(lastAccount.code);
        newCode = (lastCodeNumber + 1).toString();
      } else {
        // First subledger account for this parent
        newCode = `${parentCode}01`;
      }
      
      // Create the subledger account
      const newAccount = new ChartOfAccount({
        code: newCode,
        name: entity.name,
        type: accountType,
        subtype: accountSubtype,
        parent: parentCode,
        path: accountPath, // Using the directly created accountPath
        isSubledger: true,
        subledgerType: entityType,
        description: `Subledger for ${entityType} ${entity.name}`
      });
      
      await newAccount.save();

      return newAccount;
    } catch (error) {
      console.error('Error creating subledger account:', error);
      throw error;
    }
  }

  // Record a customer invoice transaction
  async recordCustomerInvoice(invoiceData) {
    try {
      await this.init();
      
      const {
        customerId,
        invoiceNumber,
        date,
        items,
        taxRate = 0,
        notes = ''
      } = invoiceData;
      
      // Get customer and ensure customer subledger account exists
      const customer = await Customer.findOne({ customerId });
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      
      await this.createSubledgerAccount('customer', customerId);
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      // Generate memo
      const memo = `Invoice #${invoiceNumber} to ${customer.name}`;
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        invoiceNumber, 
        date,
        organizationId: customer.organization
      });
      
      // Construct customer account path directly instead of using virtual property
      const customerAccountPath = `Assets:Current Assets:Accounts Receivable:${customer.name}`;
      
      // Debit accounts receivable (customer subledger)
      entry.debit(customerAccountPath, total, {
        customerId,
        invoiceNumber,
        date
      });
      
      // Credit revenue accounts for each item
      for (const item of items) {
        const amount = item.quantity * item.price;
        entry.credit('Revenue:Sales Revenue', amount, {
          customerId,
          invoiceNumber,
          itemDescription: item.description
        });
      }
      
      // Credit tax liability if applicable
      if (taxAmount > 0) {
        entry.credit('Liabilities:Current Liabilities:Taxes Payable', taxAmount, {
          customerId,
          invoiceNumber,
          taxRate
        });
      }
      
      // Commit the transaction
      const result = await entry.commit();
      
      return {
        success: true,
        journalId: result._id,
        message: 'Customer invoice recorded successfully',
        invoiceNumber,
        total
      };
    } catch (error) {
      console.error('Error recording customer invoice:', error);
      throw error;
    }
  }

  // Record a customer payment
  async recordCustomerPayment(paymentData) {
    try {
      await this.init();
      
      const {
        customerId,
        amount,
        paymentMethod,
        date,
        invoiceNumbers = [],
        notes = ''
      } = paymentData;
      
      // Get customer and ensure customer subledger account exists
      const customer = await Customer.findOne({ customerId });
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      
      await this.createSubledgerAccount('customer', customerId);
      
      // Generate payment reference
      const paymentRef = await Counter.getNextSequence('payment_received', {
        prefix: 'PAY-',
        paddingSize: 6
      });
      
      // Generate memo
      const invoiceRef = invoiceNumbers.length > 0 
        ? `for Invoice(s) ${invoiceNumbers.join(', ')}` 
        : '';
      const memo = `Payment Received from Customer ${customer.name} ${invoiceRef}`;
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        paymentRef, 
        date,
        organizationId: customer.organization
      });
      
      // Debit bank/cash account
      entry.debit('Assets:Current Assets:Cash and Bank', amount, {
        customerId,
        paymentMethod,
        paymentRef,
        date
      });
      
      // Construct customer account path directly
      const customerAccountPath = `Assets:Current Assets:Accounts Receivable:${customer.name}`;
      
      // Credit accounts receivable (customer subledger)
      entry.credit(customerAccountPath, amount, {
        customerId,
        paymentRef,
        invoiceNumbers,
        date
      });
      
      // Commit the transaction
      const result = await entry.commit();
      
      return {
        success: true,
        journalId: result._id,
        message: 'Customer payment recorded successfully',
        paymentRef,
        amount
      };
    } catch (error) {
      console.error('Error recording customer payment:', error);
      throw error;
    }
  }

  // Record a supplier bill
  async recordSupplierBill(billData) {
    try {
      await this.init();
      
      const {
        supplierId,
        billNumber,
        date,
        items,
        taxRate = 0,
        notes = ''
      } = billData;
      
      // Get supplier and ensure supplier subledger account exists
      const supplier = await Supplier.findOne({ supplierId });
      if (!supplier) throw new Error(`Supplier ${supplierId} not found`);
      
      await this.createSubledgerAccount('supplier', supplierId);
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      // Generate memo
      const memo = `Bill #${billNumber} from ${supplier.name}`;
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        billNumber, 
        date,
        organizationId: supplier.organization 
      });
      
      // Debit expense/inventory accounts for each item
      for (const item of items) {
        const amount = item.quantity * item.price;
        let accountPath;
        
        if (item.type === 'inventory') {
          accountPath = 'Assets:Current Assets:Inventory';
        } else if (item.type === 'expense') {
          accountPath = item.expenseAccount || 'Expenses:Other Expenses';
        } else {
          accountPath = 'Expenses:Other Expenses';
        }
        
        entry.debit(accountPath, amount, {
          supplierId,
          billNumber,
          itemDescription: item.description
        });
      }
      
      // Debit tax if applicable
      if (taxAmount > 0) {
        entry.debit('Expenses:Other Expenses:Tax Expense', taxAmount, {
          supplierId,
          billNumber,
          taxRate
        });
      }
      
      // Construct supplier account path directly
      const supplierAccountPath = `Liabilities:Current Liabilities:Accounts Payable:${supplier.name}`;
      
      // Credit accounts payable (supplier subledger)
      entry.credit(supplierAccountPath, total, {
        supplierId,
        billNumber,
        date
      });
      
      // Commit the transaction
      const result = await entry.commit();
      
      return {
        success: true,
        journalId: result._id,
        message: 'Supplier bill recorded successfully',
        billNumber,
        total
      };
    } catch (error) {
      console.error('Error recording supplier bill:', error);
      throw error;
    }
  }

  // Record a payment to a supplier
  async recordSupplierPayment(paymentData) {
    try {
      await this.init();
      
      const {
        supplierId,
        amount,
        paymentMethod,
        date,
        billNumbers = [],
        notes = ''
      } = paymentData;
      
      // Get supplier and ensure supplier subledger account exists
      const supplier = await Supplier.findOne({ supplierId });
      if (!supplier) throw new Error(`Supplier ${supplierId} not found`);
      
      await this.createSubledgerAccount('supplier', supplierId);
      
      // Generate payment reference
      const paymentRef = await Counter.getNextSequence('payment_sent', {
        prefix: 'SPAY-',
        paddingSize: 6
      });
      
      // Generate memo
      const billRef = billNumbers.length > 0 
        ? `for Bill(s) ${billNumbers.join(', ')}` 
        : '';
      const memo = `Payment Sent to Supplier ${supplier.name} ${billRef}`;
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        paymentRef, 
        date,
        organizationId: supplier.organization
      });
      
      // Construct supplier account path directly
      const supplierAccountPath = `Liabilities:Current Liabilities:Accounts Payable:${supplier.name}`;
      
      // Debit accounts payable (supplier subledger)
      entry.debit(supplierAccountPath, amount, {
        supplierId,
        paymentRef,
        billNumbers,
        date
      });
      
      // Credit bank/cash account
      entry.credit('Assets:Current Assets:Cash and Bank', amount, {
        supplierId,
        paymentMethod,
        paymentRef,
        date
      });
      
      // Commit the transaction
      const result = await entry.commit();
      
      return {
        success: true,
        journalId: result._id,
        message: 'Supplier payment recorded successfully',
        paymentRef,
        amount
      };
    } catch (error) {
      console.error('Error recording supplier payment:', error);
      throw error;
    }
  }

  // Record employee payroll
  async recordEmployeePayroll(payrollData) {
    try {
      await this.init();
      
      const {
        employeeId,
        payPeriod,
        paymentDate,
        basic,
        allowances = 0,
        deductions = 0,
        taxWithholding = 0,
        notes = ''
      } = payrollData;
      
      // Get employee and ensure employee subledger account exists
      const employee = await Employee.findOne({ employeeId });
      if (!employee) throw new Error(`Employee ${employeeId} not found`);
      
      await this.createSubledgerAccount('employee', employeeId);
      
      // Calculate totals
      const grossSalary = basic + allowances;
      const totalDeductions = deductions + taxWithholding;
      const netSalary = grossSalary - totalDeductions;
      
      // Generate payroll reference
      const payrollRef = await Counter.getNextSequence('payroll', {
        prefix: 'PAY-',
        paddingSize: 6
      });
      
      // Generate memo
      const memo = `Payroll for ${employee.name} - ${payPeriod}`;
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        payrollRef, 
        payPeriod, 
        paymentDate,
        organizationId: employee.organization
      });
      
      // Construct employee account path directly
      const employeeAccountPath = `Expenses:Salaries and Wages:${employee.name}`;
      
      // Debit salary expense (employee subledger)
      entry.debit(employeeAccountPath, grossSalary, {
        employeeId,
        payrollRef,
        payPeriod,
        type: 'gross_salary'
      });
      
      // Credit tax liability if applicable
      if (taxWithholding > 0) {
        entry.credit('Liabilities:Current Liabilities:Taxes Payable', taxWithholding, {
          employeeId,
          payrollRef,
          payPeriod,
          type: 'tax_withholding'
        });
      }
      
      // Credit other deductions if applicable
      if (deductions > 0) {
        entry.credit('Liabilities:Current Liabilities:Employee Deductions', deductions, {
          employeeId,
          payrollRef,
          payPeriod,
          type: 'deductions'
        });
      }
      
      // Credit bank/cash account for net salary
      entry.credit('Assets:Current Assets:Cash and Bank', netSalary, {
        employeeId,
        payrollRef,
        payPeriod,
        type: 'net_salary'
      });
      
      // Commit the transaction
      const result = await entry.commit();
      
      return {
        success: true,
        journalId: result._id,
        message: 'Employee payroll recorded successfully',
        payrollRef,
        grossSalary,
        netSalary
      };
    } catch (error) {
      console.error('Error recording employee payroll:', error);
      throw error;
    }
  }

  // Record a general journal voucher
  async recordJournalVoucher(entryData) {
    try {
      await this.init();
      
      const {
        date,
        memo,
        entries,
        reference = '',
        notes = '',
        organizationId
      } = entryData;
      
      // Ensure we have an organization ID
      if (!organizationId) {
        // Try to find the first organization
        const Organization = mongoose.models.Organization;
        const org = await Organization.findOne();
        if (!org) {
          throw new Error('Organization ID is required but not provided');
        }
        entryData.organizationId = org._id;
      }
      
      // Validate that debits = credits
      const totalDebits = entries
        .filter(entry => entry.type === 'debit')
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const totalCredits = entries
        .filter(entry => entry.type === 'credit')
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      if (totalDebits !== totalCredits) {
        throw new Error('Journal voucher must balance: total debits must equal total credits');
      }
      
      // Generate journal voucher number
      const voucherNumber = await Counter.getNextSequence('journal_voucher', {
        prefix: 'JV-',
        paddingSize: 6
      });
      
      // Create a transaction
      const entry = this.book.entry(memo, { 
        voucherNumber, 
        date, 
        reference,
        organizationId: entryData.organizationId
      });
      
      // Add all entries
      for (const item of entries) {
        const { type, account, amount, description = '', meta = {} } = item;
        
        if (type === 'debit') {
          entry.debit(account, amount, { 
            ...meta, 
            voucherNumber, 
            description 
          });
        } else if (type === 'credit') {
          entry.credit(account, amount, { 
            ...meta, 
            voucherNumber, 
            description 
          });
        }
      }
      
      // Commit the transaction
      const result = await entry.commit();

      return {
        success: true,
        journalId: result._id,
        message: 'Journal voucher recorded successfully',
        voucherNumber,
        amount: totalDebits // Since debits = credits, either value works
      };
    } catch (error) {
      console.error('Error recording journal voucher:', error);
      throw error;
    }
  }

  // Get account balances for general ledger and subledgers
  async getAccountBalances() {
    try {
      await this.init();
      // Get all accounts
      const accounts = await ChartOfAccount.find({ active: true }).sort({ path: 1 });
      // Calculate balances for each account
      const balances = [];
      for (const account of accounts) {
        let result;
        if (account.isSubledger) {
          // Sum all sub-accounts (all transactions whose account_path starts with this path + ':')
          const agg = await mongoose.models.AccountingTransaction.aggregate([
            { $match: { account_path: { $regex: `^${account.path}:` }, organization: account.organization } },
            { $group: { _id: null, total: { $sum: { $cond: [ { $eq: ['$debit', true] }, '$amount', { $multiply: ['$amount', -1] } ] } } } }
          ]);
          result = agg[0]?.total || 0;
        } else {
          // Existing logic for non-subledger accounts
          result = await this.book.balance({ account: account.path });
        }
        balances.push({
          code: account.code,
          name: account.name,
          path: account.path,
          type: account.type,
          subtype: account.subtype,
          isSubledger: account.isSubledger,
          subledgerType: account.subledgerType,
          balance: result
        });
      }
      return balances;
    } catch (error) {
      console.error('Error getting account balances:', error);
      throw error;
    }
  }

  // Get transactions for a specific account
  async getAccountTransactions(accountPath, filters = {}) {
    try {
      await this.init();
      
      const { startDate, endDate, limit = 100, skip = 0 } = filters;
      
      // Build query
      const query = { account_path: accountPath };
      
      if (startDate || endDate) {
        query.datetime = {};
        if (startDate) query.datetime.$gte = new Date(startDate);
        if (endDate) query.datetime.$lte = new Date(endDate);
      }
      
      // Get transactions
      const transactions = await mongoose.models.AccountingTransaction.find(query)
        .sort({ datetime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('journal')
        .lean();
      
      return transactions.map(txn => ({
        _id: txn._id,
        datetime: txn.datetime,
        account: txn.account_path,
        debit: txn.debit,
        credit: txn.credit,
        amount: txn.amount,
        memo: txn.journal?.memo || '',
        meta: txn.meta
      }));
    } catch (error) {
      console.error('Error getting account transactions:', error);
      throw error;
    }
  }

  // Get account statement for a customer, supplier, or employee
  async getEntityStatement(entityType, entityId, filters = {}) {
    try {
      await this.init();
      
      let entity;
      let accountPath;
      
      // Get the entity and determine its ledger path
      switch (entityType) {
        case 'customer':
          entity = await Customer.findOne({ customerId: entityId });
          if (!entity) throw new Error(`Customer ${entityId} not found`);
          accountPath = `Assets:Current Assets:Accounts Receivable:${entity.name}`;
          break;
        
        case 'supplier':
          entity = await Supplier.findOne({ supplierId: entityId });
          if (!entity) throw new Error(`Supplier ${entityId} not found`);
          accountPath = `Liabilities:Current Liabilities:Accounts Payable:${entity.name}`;
          break;
        
        case 'employee':
          entity = await Employee.findOne({ employeeId: entityId });
          if (!entity) throw new Error(`Employee ${entityId} not found`);
          accountPath = `Expenses:Salaries and Wages:${entity.name}`;
          break;
          
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Get the transactions for this entity
      const transactions = await this.getAccountTransactions(accountPath, filters);
      
      // Get the current balance
      const balance = await this.book.balance({
        account: accountPath
      });
      
      return {
        entityType,
        entityId,
        entityName: entity.name,
        accountPath,
        currentBalance: balance,
        transactions
      };
    } catch (error) {
      console.error(`Error getting ${entityType} statement:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new AccountingService(); 
