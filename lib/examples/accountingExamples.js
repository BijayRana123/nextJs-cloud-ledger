import AccountingService from '../services/AccountingService';
import Customer from '../models/Customer';
import Supplier from '../models/Supplier';
import Employee from '../models/Employee';
import Organization from '../models/Organization';
import dbConnect from '../dbConnect';
import Counter from '../models/Counter';

// Example function to set up demo data
async function setupDemoData() {

  
  try {
    // Connect to database
    await dbConnect();
    
    // Check if organization already exists
    let organization = await Organization.findOne({ name: 'Cloud Ledger Inc' });
    
    // If not, create a new one
    if (!organization) {
      organization = new Organization({
        name: 'Cloud Ledger Inc',
        email: 'info@cloudledger.com',
        phone: '555-987-6543',
        address: '789 Corporate Ave, Business District, CA 94025, USA',
        website: 'www.cloudledger.com',
        taxId: 'TAX-CLOUD-1234',
        industry: 'Technology',
        description: 'A demo organization for testing the accounting system'
      });
      
      await organization.save();

    } else {

    }
    
    // Check if customers already exist
    let customer1 = await Customer.findOne({ name: 'Acme Corporation' });
    if (!customer1) {
      customer1 = new Customer({
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '555-123-4567',
        address: '123 Main Street, Metropolis, NY 10001, USA',
        organization: organization._id,
        code: 'ACME001',
        contactType: 'Business',
        contactPerson: {
          name: 'John Doe',
          email: 'john@acme.com',
          phone: '555-123-4568'
        },
        taxId: 'TAX-ACME-1234',
        creditLimit: 10000
      });
      
      await customer1.save();

    } else {

    }
    
    // Check if second customer exists
    let customer2 = await Customer.findOne({ name: 'Globex Corporation' });
    if (!customer2) {
      customer2 = new Customer({
        name: 'Globex Corporation',
        email: 'accounts@globex.com',
        phone: '555-987-6543',
        address: '456 Tech Avenue, Silicon Valley, CA 94025, USA',
        organization: organization._id,
        code: 'GLOBEX001',
        contactType: 'Business',
        contactPerson: {
          name: 'Jane Smith',
          email: 'jane@globex.com',
          phone: '555-987-6544'
        },
        taxId: 'TAX-GLOBEX-5678',
        creditLimit: 20000
      });
      
      await customer2.save();

    } else {

    }
    
    // Check if supplier exists
    let supplier1 = await Supplier.findOne({ name: 'Tech Supplies Inc' });
    if (!supplier1) {
      supplier1 = new Supplier({
        name: 'Tech Supplies Inc',
        email: 'orders@techsupplies.com',
        phone: '555-444-3333',
        address: '789 Industry Road, Techville, WA 98001, USA',
        organization: organization._id,
        code: 'TECH001',
        contactType: 'Business',
        contactPerson: {
          name: 'Robert Johnson',
          email: 'robert@techsupplies.com',
          phone: '555-444-3334'
        },
        taxId: 'TAX-TECH-9012',
        paymentTerms: 'Net 45'
      });
      
      await supplier1.save();

    } else {

    }
    
    // Check if second supplier exists
    let supplier2 = await Supplier.findOne({ name: 'Office Essentials Ltd' });
    if (!supplier2) {
      supplier2 = new Supplier({
        name: 'Office Essentials Ltd',
        email: 'sales@officeessentials.com',
        phone: '555-777-8888',
        address: '321 Office Park, Business City, IL 60601, USA',
        organization: organization._id,
        code: 'OFFICE001',
        contactType: 'Business',
        contactPerson: {
          name: 'Sarah Williams',
          email: 'sarah@officeessentials.com',
          phone: '555-777-8889'
        },
        taxId: 'TAX-OFFICE-3456',
        paymentTerms: 'Net 30'
      });
      
      await supplier2.save();

    } else {

    }
    
    // Check if employee exists
    let employee1 = await Employee.findOne({ name: 'Michael Brown' });
    
    // For testing purposes, try to create a new employee with explicit ID
    if (!employee1) {
      try {
        // First get a new employee ID from the counter
        const employeeId = await Counter.getNextSequence('employee', {
          prefix: 'EMP-',
          paddingSize: 5
        });
        
        employee1 = new Employee({
          employeeId, // Explicitly set the ID
          name: 'Michael Brown',
          email: 'michael@company.com',
          phone: '555-222-1111',
          address: '456 Employee Drive, Staffville, NY 10002, USA',
          organization: organization._id,
          code: 'EMP001',
          contactType: 'Employee',
          position: 'Sales Manager',
          department: 'Sales',
          startDate: new Date('2022-01-15'),
          salaryInfo: {
            basic: 5000,
            allowances: 500,
            deductions: 200
          }
        });
        
        await employee1.save();

      } catch (error) {
        console.error('Error creating employee:', error);
        // If we can't create an employee, create a placeholder
        employee1 = {
          name: 'Placeholder Employee',
          employeeId: 'EMP-PLACEHOLDER'
        };
      }
    } else {

    }
    

    
    return {
      organization,
      customers: [customer1, customer2],
      suppliers: [supplier1, supplier2],
      employees: [employee1]
    };
  } catch (error) {
    console.error('Error setting up demo data:', error);
    throw error; // Re-throw to be caught by the main function
  }
}

// Example function to create accounting entries
async function createDemoTransactions(demoData) {

  
  const { customers, suppliers, employees } = demoData;
  
  // 1. Create a customer invoice
  const invoiceResult = await AccountingService.recordCustomerInvoice({
    customerId: customers[0].customerId,
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
  

  
  // 2. Record payment from customer
  const customerPaymentResult = await AccountingService.recordCustomerPayment({
    customerId: customers[0].customerId,
    amount: 800, // Partial payment of the invoice
    paymentMethod: 'Bank Transfer',
    date: new Date(),
    invoiceNumbers: ['INV-2023-001'],
    notes: 'Partial payment'
  });
  

  
  // 3. Create a supplier bill
  const billResult = await AccountingService.recordSupplierBill({
    supplierId: suppliers[0].supplierId,
    billNumber: 'BILL-2023-001',
    date: new Date(),
    items: [
      {
        description: 'Raw Material X',
        quantity: 10,
        price: 50,
        type: 'inventory'
      },
      {
        description: 'Office Supplies',
        quantity: 1,
        price: 200,
        type: 'expense',
        expenseAccount: 'Expenses:Other Expenses:Office Supplies'
      }
    ],
    taxRate: 5,
    notes: 'Monthly supplies'
  });
  

  
  // 4. Record payment to supplier
  const supplierPaymentResult = await AccountingService.recordSupplierPayment({
    supplierId: suppliers[0].supplierId,
    amount: 500, // Partial payment of the bill
    paymentMethod: 'Check',
    date: new Date(),
    billNumbers: ['BILL-2023-001'],
    notes: 'Partial payment'
  });
  

  
  // 5. Record employee payroll
  const payrollResult = await AccountingService.recordEmployeePayroll({
    employeeId: employees[0].employeeId,
    payPeriod: 'January 2023',
    paymentDate: new Date(),
    basic: 5000,
    allowances: 500,
    deductions: 200,
    taxWithholding: 1000,
    notes: 'January payroll'
  });
  

  
  // 6. Create a general journal voucher
  const journalVoucherResult = await AccountingService.recordJournalVoucher({
    memo: "Initial investment by owner",
    entries: [
      { account: "Assets:Cash", type: "debit", amount: 50000.00 },
      { account: "Equity:Owner Capital", type: "credit", amount: 50000.00 }
    ]
  });

  

}

// Example function to generate reports
async function generateDemoReports(demoData) {

  
  // 1. Get all account balances
  const balances = await AccountingService.getAccountBalances();

  
  // 2. Get customer statement
  const customerStatement = await AccountingService.getEntityStatement(
    'customer', 
    demoData.customers[0].customerId
  );

  
  // 3. Get supplier statement
  const supplierStatement = await AccountingService.getEntityStatement(
    'supplier', 
    demoData.suppliers[0].supplierId
  );

  
  // 4. Get employee statement
  const employeeStatement = await AccountingService.getEntityStatement(
    'employee', 
    demoData.employees[0].employeeId
  );

  
  // 5. Get transactions for cash account
  const cashTransactions = await AccountingService.getAccountTransactions(
    'Assets:Current Assets:Cash and Bank'
  );

  

}

// Main function to run everything
export async function runAccountingDemo() {
  try {
    // Set up demo data
    const demoData = await setupDemoData();
    
    // Create demo transactions
    await createDemoTransactions(demoData);
    
    // Generate demo reports
    await generateDemoReports(demoData);
    

    return { success: true };
  } catch (error) {
    console.error('Error running accounting demo:', error);
    return { success: false, error: error.message };
  }
}

// Export individual functions for direct usage
export {
  setupDemoData,
  createDemoTransactions,
  generateDemoReports
}; 
