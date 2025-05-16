import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { getBook } from '@/lib/accounting';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const createTestTransaction = searchParams.get('createTest') === 'true';

    // If requested, create a test transaction
    let testTransactionResult = null;
    if (createTestTransaction) {
      testTransactionResult = await createTestAccountingEntry();
    }

    // Get transaction count
    const transactionCount = await mongoose.model('Medici_Transaction').countDocuments();
    
    // Get journal count
    const journalCount = await mongoose.model('Medici_Journal').countDocuments();
    
    // Get top 5 most recent transaction records
    const recentTransactions = await mongoose.model('Medici_Transaction')
      .find()
      .sort({ datetime: -1 })
      .limit(5);
      
    // Get account balances for major accounts
    const accountBalances = await getAccountBalances();
    
    return NextResponse.json({
      connectionStatus: 'Connected',
      databaseName: mongoose.connection.db.databaseName,
      counts: {
        transactions: transactionCount,
        journals: journalCount
      },
      testTransaction: testTransactionResult,
      recentTransactions,
      accountBalances
    });
  } catch (error) {
    console.error("Error in accounting diagnostics:", error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve accounting diagnostics',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

async function getAccountBalances() {
  const transactionModel = mongoose.model('Medici_Transaction');
  
  // Define major account categories with proper capitalization
  const accountPrefixes = [
    'Assets:Cash',
    'Assets:Bank',
    'Assets:Accounts Receivable',
    'Assets:Inventory',
    'Liabilities:Accounts Payable',
    'Income:Sales Revenue',
    'Expenses'
  ];
  
  const balances = {};
  
  for (const prefix of accountPrefixes) {
    const result = await transactionModel.aggregate([
      { 
        $match: { 
          accounts: { $regex: new RegExp(`^${prefix}`, 'i') } // Make case-insensitive
        } 
      },
      {
        $group: {
          _id: "$accounts",
          amount: {
            $sum: {
              $cond: [
                { $eq: ["$credit", true] },
                { $multiply: ["$amount", -1] },
                "$amount"
              ]
            }
          }
        }
      }
    ]);
    
    // Store results by account prefix
    balances[prefix] = result;
  }
  
  return balances;
}

// Create a test transaction to verify the system works
async function createTestAccountingEntry() {
  try {
    // Get the book instance
    const book = await getBook();
    
    // Create a test transaction
    const testAmount = 100.00;
    const timestamp = new Date().toISOString();
    const journal = await book.entry(`Test Transaction ${timestamp}`);
    
    // Simple expense transaction: Debit expense, credit cash
    // Use standardized account names with proper capitalization
    journal.debit(standardizeAccountName('Expenses:Test Expense'), testAmount, { 
      description: 'Test transaction created from diagnostics' 
    });
    journal.credit(standardizeAccountName('Assets:Cash'), testAmount, { 
      description: 'Test transaction created from diagnostics' 
    });
    
    // Commit the journal entry
    const result = await journal.commit();
    
    return {
      success: true,
      message: 'Test transaction created successfully',
      journalId: result._id,
      timestamp
    };
  } catch (error) {
    console.error('Error creating test transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 