import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getBook, getJournalEntries, connectToDatabase } from '@/lib/accounting';
// Import necessary models
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    // Ensure MongoDB is connected
    await dbConnect();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database connection not established' },
        { status: 500 }
      );
    }

    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('searchTerm');

    // Build query object
    const query = {};
    
    // Add date range filters if provided
    if (startDate && endDate) {
      query.datetime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.datetime = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.datetime = { $lte: new Date(endDate) };
    }

    // Add search term filter if provided
    if (searchTerm) {
      query.memo = { $regex: searchTerm, $options: 'i' };
    }

    // Options for pagination
    const options = {
      page,
      perPage: limit,
    };

    try {
      // Use our custom journal entries function instead of book.ledger()
      let journalEntries = await getJournalEntries(query, options);
      
      // Get the models we need for populating data
      const Customer = mongoose.models.Customer;
      const Supplier = mongoose.models.Supplier;
      const SalesOrder = mongoose.models.SalesOrder;
      const PurchaseOrder = mongoose.models.PurchaseOrder;
      
      // Enhance journal entries with additional data
      const enhancedEntries = await Promise.all(journalEntries.map(async (entry) => {
        let enhancedEntry = { ...entry };
        
        // Process the memo to replace IDs with names
        if (entry.memo) {
          // For payment received from customer
          if (entry.memo.includes('Payment Received from Customer')) {
            // Extract customer ID - handle both formats with and without invoice reference
            const customerId = entry.memo.includes(' for Invoice ')
              ? entry.memo.split('Customer ')[1].split(' for Invoice ')[0]
              : entry.memo.split('Customer ')[1];
              
            try {
              const customer = await Customer.findById(customerId);
              if (customer) {
                // Check if we have an invoice reference
                if (entry.memo.includes(' for Invoice ')) {
                  const invoiceRef = entry.memo.split(' for Invoice ')[1];
                  enhancedEntry.memo = `Payment Received from Customer ${customer.name} for Invoice ${invoiceRef}`;
                } else {
                  // Also check transaction meta for invoice number
                  const invoiceRef = entry.transactions?.[0]?.meta?.invoiceNumber;
                  if (invoiceRef) {
                    enhancedEntry.memo = `Payment Received from Customer ${customer.name} for Invoice ${invoiceRef}`;
                  } else {
                    enhancedEntry.memo = `Payment Received from Customer ${customer.name}`;
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching customer:', error);
            }
          }
          
          // For payment sent to supplier
          else if (entry.memo.includes('Payment Sent to Supplier')) {
            // Extract supplier ID - handle both formats with and without bill reference
            const supplierId = entry.memo.includes(' for Bill ')
              ? entry.memo.split('Supplier ')[1].split(' for Bill ')[0]
              : entry.memo.split('Supplier ')[1];
              
            try {
              const supplier = await Supplier.findById(supplierId);
              if (supplier) {
                // Check if we have a bill reference
                if (entry.memo.includes(' for Bill ')) {
                  const billRef = entry.memo.split(' for Bill ')[1];
                  enhancedEntry.memo = `Payment Sent to Supplier ${supplier.name} for Bill ${billRef}`;
                } else {
                  // Also check transaction meta for bill number
                  const billRef = entry.transactions?.[0]?.meta?.billNumber;
                  if (billRef) {
                    enhancedEntry.memo = `Payment Sent to Supplier ${supplier.name} for Bill ${billRef}`;
                  } else {
                    enhancedEntry.memo = `Payment Sent to Supplier ${supplier.name}`;
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching supplier:', error);
            }
          }
          
          // For sales orders
          else if (entry.memo.includes('Sales Order to Customer')) {
            // Extract the customer ID
            const customerId = entry.memo.replace('Sales Order to Customer ', '');
            
            // Only process if it looks like a MongoDB ID
            if (mongoose.Types.ObjectId.isValid(customerId.trim())) {
              try {
                const customer = await Customer.findById(customerId.trim());
                if (customer) {
                  enhancedEntry.memo = `Sales Order to Customer ${customer.name}`;
                }
              } catch (error) {
                console.error('Error fetching customer for sales order:', error);
              }
            } 
            // If no specific customer in the memo, check transaction meta
            else if (customerId.trim() === '' && entry.transactions && entry.transactions.length > 0) {
              const txnCustomerId = entry.transactions[0]?.meta?.customerId;
              if (txnCustomerId) {
                try {
                  const customer = await Customer.findById(txnCustomerId);
                  if (customer) {
                    enhancedEntry.memo = `Sales Order to Customer ${customer.name}`;
                  }
                } catch (error) {
                  console.error('Error fetching customer from meta:', error);
                }
              }
            }
          }
          
          // For purchase orders
          else if (entry.memo.includes('Purchase Order from Supplier')) {
            // Extract the supplier ID
            const supplierId = entry.memo.replace('Purchase Order from Supplier ', '');
            
            // Only process if it looks like a MongoDB ID
            if (mongoose.Types.ObjectId.isValid(supplierId.trim())) {
              try {
                const supplier = await Supplier.findById(supplierId.trim());
                if (supplier) {
                  enhancedEntry.memo = `Purchase Order from Supplier ${supplier.name}`;
                }
              } catch (error) {
                console.error('Error fetching supplier for purchase order:', error);
              }
            }
            // If no specific supplier in the memo, check transaction meta
            else if (supplierId.trim() === '' && entry.transactions && entry.transactions.length > 0) {
              const txnSupplierId = entry.transactions[0]?.meta?.supplierId;
              if (txnSupplierId) {
                try {
                  const supplier = await Supplier.findById(txnSupplierId);
                  if (supplier) {
                    enhancedEntry.memo = `Purchase Order from Supplier ${supplier.name}`;
                  }
                } catch (error) {
                  console.error('Error fetching supplier from meta:', error);
                }
              }
            }
          }
        }
        
        return enhancedEntry;
      }));
      
      // Get total count for pagination
      let totalCount = 0;
      
      try {
        const journalModel = mongoose.model('Medici_Journal');
        totalCount = await journalModel.countDocuments({ ...query, book: 'cloud_ledger' });
      } catch (countError) {
        console.error('Error counting journal entries:', countError);
      }

      return NextResponse.json({
        journalEntries: enhancedEntries,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          perPage: limit,
        },
      });
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      
      // Return an empty result with error message
      return NextResponse.json({
        error: 'Failed to fetch journal entries: ' + error.message,
        journalEntries: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          perPage: limit,
        },
      });
    }
  } catch (error) {
    console.error('Error in journal entries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries', journalEntries: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    const { memo, transactions } = data;

    // Validate input
    if (!memo || !transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid journal entry data. Memo and transactions are required.' },
        { status: 400 }
      );
    }

    // Validate all transaction amounts are proper numbers
    const hasInvalidAmount = transactions.some(t => {
      const amount = Number(t.amount);
      return isNaN(amount) || amount <= 0;
    });

    if (hasInvalidAmount) {
      return NextResponse.json(
        { error: 'All transaction amounts must be valid positive numbers.' },
        { status: 400 }
      );
    }

    // Convert all amounts to numbers
    const validatedTransactions = transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount)
    }));

    // Check if debits equal credits
    const totalDebits = validatedTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCredits = validatedTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Validate accounting equation (debits = credits)
    if (Math.abs(totalDebits - totalCredits) > 0.001) { // Allow small rounding differences
      // Auto-fix simple entries with just 2 transactions
      if (validatedTransactions.length === 2) {
        if (totalDebits > totalCredits) {
          const creditTxn = validatedTransactions.find(t => t.type === 'credit');
          if (creditTxn) creditTxn.amount = totalDebits;
        } else {
          const debitTxn = validatedTransactions.find(t => t.type === 'debit');
          if (debitTxn) debitTxn.amount = totalCredits;
        }
      } else {
        return NextResponse.json(
          { error: 'Debits must equal credits. Please check your transaction amounts.' },
          { status: 400 }
        );
      }
    }

    // Create the journal entry
    try {
      const book = await getBook();
      
      if (!book) {
        return NextResponse.json(
          { error: 'Failed to initialize accounting book' },
          { status: 500 }
        );
      }
  
      // Create journal entry
      const journal = await book.entry(memo);
      
      if (!journal) {
        return NextResponse.json(
          { error: 'Failed to create journal entry' },
          { status: 500 }
        );
      }
  
      // Add transactions to journal entry
      for (const transaction of validatedTransactions) {
        const { account, amount, type, meta = {} } = transaction;
        
        if (type === 'debit') {
          journal.debit(account, amount, meta);
        } else if (type === 'credit') {
          journal.credit(account, amount, meta);
        }
      }
  
      // Commit the journal entry
      const result = await journal.commit();
      
      return NextResponse.json({
        message: 'Journal entry created successfully',
        journalEntry: result,
      });
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return NextResponse.json(
        { error: 'Failed to create journal entry' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing journal entry request:', error);
    return NextResponse.json(
      { error: 'Failed to process journal entry request' },
      { status: 500 }
    );
  }
} 