import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { getBook } from '@/lib/accounting';

export async function POST(request) {
  try {
    // Ensure MongoDB is connected
    await dbConnect();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database connection not established' },
        { status: 500 }
      );
    }

    // Parse request body to get the date range
    const body = await request.json();
    const startDate = body.startDate ? new Date(body.startDate) : new Date(new Date().getFullYear(), 0, 1); // Default: Jan 1 current year
    const endDate = body.endDate ? new Date(body.endDate) : new Date(); // Default: Today
    
    // Get the book instance
    const book = await getBook();
    
    // Create query to get all transactions within the date range
    const query = {
      datetime: { 
        $gte: startDate,
        $lte: endDate 
      },
      voided: false
    };

    // Initialize revenue and expense arrays
    const revenues = [];
    const expenses = [];
    
    // Define account categories
    const revenueAccounts = [
      'Income:Sales Revenue',
      'Income:Service Revenue',
      'Income:Interest Income',
      'Income:Other Income'
    ];
    
    const expenseAccounts = [
      'Expenses:Cost of Goods Sold',
      'Expenses:Salary Expense',
      'Expenses:Rent Expense',
      'Expenses:Utilities Expense',
      'Expenses:Advertising Expense',
      'Expenses:Office Supplies',
      'Expenses:Depreciation Expense',
      'Expenses:Insurance Expense',
      'Expenses:Interest Expense',
      'Expenses:Travel Expense',
      'Expenses:Meals and Entertainment'
    ];
    
    // Use MongoDB's aggregation to get balances for each account category
    const transactionModel = mongoose.model('Medici_Transaction');
    
    // Helper function to get account balance
    async function getAccountBalance(accountPrefix) {
      const result = await transactionModel.aggregate([
        { 
          $match: { 
            ...query,
            accounts: { $regex: new RegExp(`^${accountPrefix}`, 'i') }
          } 
        },
        {
          $group: {
            _id: "$accounts",
            amount: {
              $sum: {
                $cond: [
                  { $eq: ["$credit", true] },
                  "$amount",
                  { $multiply: ["$amount", -1] }  // Negate debit amounts
                ]
              }
            }
          }
        }
      ]);
      
      return result;
    }
    
    // Get revenue account balances
    for (const account of revenueAccounts) {
      const balances = await getAccountBalance(account);
      for (const balance of balances) {
        // Extract the last part of the account path as the display name
        const accountName = balance._id.split(':').pop();
        // Revenue accounts normally have credit balances (positive)
        revenues.push({
          account: accountName,
          amount: balance.amount
        });
      }
    }
    
    // Get expense account balances
    for (const account of expenseAccounts) {
      const balances = await getAccountBalance(account);
      for (const balance of balances) {
        // Extract the last part of the account path as the display name
        const accountName = balance._id.split(':').pop();
        // Expense accounts normally have debit balances, but we negate in the aggregation
        // so we need to negate again to show positive values for expenses
        expenses.push({
          account: accountName,
          amount: -balance.amount
        });
      }
    }
    
    // Calculate totals
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    
    // Format response
    const response = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      revenues,
      expenses,
      totals: {
        totalRevenue,
        totalExpenses,
        netIncome
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating income statement:", error);
    return NextResponse.json(
      { error: 'Failed to generate income statement', details: error.message },
      { status: 500 }
    );
  }
} 