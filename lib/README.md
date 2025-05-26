# Double-Entry Accounting System

A double-entry accounting system built with Next.js, MongoDB, and the Medici package.

## Overview

This accounting system implements a full double-entry bookkeeping solution with subledgers for entities like customers, suppliers, and employees. It follows standard accounting principles where every transaction affects at least two accounts - one debit and one credit - and the total debits always equal the total credits.

## Key Features

- **Chart of Accounts**: Hierarchical structure of accounts organized by type (assets, liabilities, equity, revenue, expenses)
- **Subledgers**: Separate ledgers for customers, suppliers, and employees
- **Transaction Types**: Support for invoices, bills, payments, payroll, and general journal entries
- **Voucher System**: Automatic generation of sequential voucher numbers
- **Reporting**: Balance sheets, ledger reports, and entity statements

## Account Structure

The system uses a hierarchical path-based approach to represent accounts:

- `Assets:Current Assets:Cash and Bank`
- `Assets:Current Assets:Accounts Receivable:Customer Name`
- `Liabilities:Current Liabilities:Accounts Payable:Supplier Name`
- `Expenses:Salaries and Wages:Employee Name`

## Usage Examples

### Recording a Customer Invoice

```javascript
const result = await AccountingService.recordCustomerInvoice({
  customerId: 'CUST-00001',
  invoiceNumber: 'INV-2023-001',
  date: new Date(),
  items: [
    {
      description: 'Product A',
      quantity: 5,
      price: 100
    },
    {
      description: 'Product B',
      quantity: 2,
      price: 150
    }
  ],
  taxRate: 10,
  notes: 'First invoice for the month'
});
```

This creates:
- A debit to `Assets:Current Assets:Accounts Receivable:Customer Name`
- Credits to `Revenue:Sales Revenue`
- A credit to `Liabilities:Current Liabilities:Taxes Payable` (if applicable)

### Recording a Payment from a Customer

```javascript
const result = await AccountingService.recordCustomerPayment({
  customerId: 'CUST-00001',
  amount: 800,
  paymentMethod: 'Bank Transfer',
  date: new Date(),
  invoiceNumbers: ['INV-2023-001'],
  notes: 'Partial payment'
});
```

This creates:
- A debit to `Assets:Current Assets:Cash and Bank`
- A credit to `Assets:Current Assets:Accounts Receivable:Customer Name`

### Retrieving Account Balance

```javascript
// Get all account balances
const balances = await AccountingService.getAccountBalances();

// Get statement for a specific customer
const customerStatement = await AccountingService.getEntityStatement(
  'customer', 
  'CUST-00001'
);
```

## API Endpoints

- `GET /api/accounting?action=balances` - Get all account balances
- `GET /api/accounting?action=transactions&account=Assets:Current Assets:Cash and Bank` - Get transactions for an account
- `GET /api/accounting?action=statement&entityType=customer&entityId=CUST-00001` - Get statement for an entity
- `POST /api/accounting` - Create accounting entries (with action parameter in body)
- `POST /api/accounting/demo` - Run the accounting demo

## Technical Implementation

The system uses:
- MongoDB for data storage
- Mongoose for data modeling
- Medici package for double-entry accounting
- Next.js for the API endpoints 