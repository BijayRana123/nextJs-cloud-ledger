import { Book } from 'medici';
import mongoose from 'mongoose';

// Define your MongoDB connection string
const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

// Connect to MongoDB
mongoose.connect(mongoConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Create a new book
const book = new Book('cloud_ledger');

// Define a more detailed chart of accounts
const accounts = {
  assets: ['Cash', 'Bank', 'Accounts Receivable', 'Inventory', 'Equipment', 'Vehicles'],
  liabilities: ['Accounts Payable', 'Loans'],
  income: ['Sales Revenue', 'Interest Income', 'Other Income'],
  expenses: ['Cost of Goods Sold', 'Rent Expense', 'Utilities Expense', 'Salaries Expense', 'Office Supplies Expense', 'Travel Expense'],
  equity: ["Owner's Equity", "Owner's Drawings"]
};

// Function to create a journal entry for a purchase order
async function createPurchaseEntry(purchaseOrder) {
  // Example: Debit Inventory, Credit Accounts Payable
  const journal = await book.entry(`Purchase Order #${purchaseOrder._id}`);
  journal.debit('assets:Inventory', purchaseOrder.totalAmount, { purchaseOrderId: purchaseOrder._id });
  journal.credit('liabilities:Accounts Payable', purchaseOrder.totalAmount, { purchaseOrderId: purchaseOrder._id });
  await journal.commit();
}

// Function to create a journal entry for a sales order
async function createSalesEntry(salesOrder) {
  // Example: Debit Accounts Receivable, Credit Sales Revenue
  const journal = await book.entry(`Sales Order #${salesOrder._id}`);
  journal.debit('assets:Accounts Receivable', salesOrder.totalAmount, { salesOrderId: salesOrder._id });
  journal.credit('income:Sales Revenue', salesOrder.totalAmount, { salesOrderId: salesOrder._id });
  // You would also typically debit Cost of Goods Sold and credit Inventory here when the sale occurs
  await journal.commit();
}

// Function to create a journal entry for receiving payment from a customer
async function createPaymentReceivedEntry(paymentDetails) {
  // Example: Debit Cash/Bank, Credit Accounts Receivable
  const journal = await book.entry(`Payment Received from Customer ${paymentDetails.customerId}`);
  journal.debit(`assets:${paymentDetails.paymentMethod}`, paymentDetails.amount, { customerId: paymentDetails.customerId, salesOrderId: paymentDetails.salesOrderId });
  journal.credit('assets:Accounts Receivable', paymentDetails.amount, { customerId: paymentDetails.customerId, salesOrderId: paymentDetails.salesOrderId });
  await journal.commit();
}

// Function to create a journal entry for paying a supplier
async function createPaymentSentEntry(paymentDetails) {
  // Example: Debit Accounts Payable, Credit Cash/Bank
  const journal = await book.entry(`Payment Sent to Supplier ${paymentDetails.supplierId}`);
  journal.debit('liabilities:Accounts Payable', paymentDetails.amount, { supplierId: paymentDetails.supplierId, purchaseOrderId: paymentDetails.purchaseOrderId });
  journal.credit(`assets:${paymentDetails.paymentMethod}`, paymentDetails.amount, { supplierId: paymentDetails.supplierId, purchaseOrderId: paymentDetails.purchaseOrderId });
  await journal.commit();
}

// Function to create a journal entry for recording an expense
async function createExpenseEntry(expenseDetails) {
  // Example: Debit Expense, Credit Accounts Payable/Cash/Bank
  const journal = await book.entry(`Expense: ${expenseDetails.description}`);
  journal.debit(`expenses:${expenseDetails.expenseType}`, expenseDetails.amount, { expenseId: expenseDetails._id, description: expenseDetails.description });
  journal.credit(`liabilities:${expenseDetails.paymentMethod === 'Credit' ? 'Accounts Payable' : ''}assets:${expenseDetails.paymentMethod !== 'Credit' ? expenseDetails.paymentMethod : ''}`, expenseDetails.amount, { expenseId: expenseDetails._id, description: expenseDetails.description });
  await journal.commit();
}

// Function to create a journal entry for recording other income
async function createOtherIncomeEntry(incomeDetails) {
  // Example: Debit Cash/Bank, Credit Other Income
  const journal = await book.entry(`Other Income: ${incomeDetails.description}`);
  journal.debit(`assets:${incomeDetails.receiptMethod}`, incomeDetails.amount, { incomeId: incomeDetails._id, description: incomeDetails.description });
  journal.credit(`income:${incomeDetails.incomeType}`, incomeDetails.amount, { incomeId: incomeDetails._id, description: incomeDetails.description });
  await journal.commit();
}

// Function to create a journal entry for owner's investment
async function createOwnerInvestmentEntry(investmentDetails) {
  // Example: Debit Cash/Bank, Credit Owner's Equity
  const journal = await book.entry(`Owner Investment`);
  journal.debit(`assets:${investmentDetails.method}`, investmentDetails.amount, { investmentId: investmentDetails._id });
  journal.credit('equity:Owner\'s Equity', investmentDetails.amount, { investmentId: investmentDetails._id });
  await journal.commit();
}

// Function to create a journal entry for owner's drawings
async function createOwnerDrawingsEntry(drawingsDetails) {
  // Example: Debit Owner's Drawings, Credit Cash/Bank
  const journal = await book.entry(`Owner Drawings`);
  journal.debit('equity:Owner\'s Drawings', drawingsDetails.amount, { drawingsId: drawingsDetails._id });
  journal.credit(`assets:${drawingsDetails.method}`, drawingsDetails.amount, { drawingsId: drawingsDetails._id });
  await journal.commit();
}


export {
  book,
  accounts,
  createPurchaseEntry,
  createSalesEntry,
  createPaymentReceivedEntry,
  createPaymentSentEntry,
  createExpenseEntry,
  createOtherIncomeEntry,
  createOwnerInvestmentEntry,
  createOwnerDrawingsEntry
};
