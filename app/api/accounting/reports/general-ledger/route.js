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

    // Parse request body to get parameters
    const body = await request.json();
    const startDate = body.startDate ? new Date(body.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = body.endDate ? new Date(body.endDate) : new Date();
    const account = body.account || null;
    
    // Create query to get transactions
    const query = {
      datetime: { 
        $gte: startDate,
        $lte: endDate 
      },
      voided: false
    };
    
    // If account is specified, filter by that account
    if (account) {
      query.accounts = { $regex: new RegExp(`^${account}`, 'i') }; // Case-insensitive
    }
    
    // Get transactions
    const transactionModel = mongoose.model('Medici_Transaction');
    const transactions = await transactionModel.find(query)
      .sort({ datetime: -1 })
      .lean();
    
    // Group transactions by account
    const accountGroups = {};
    
    for (const transaction of transactions) {
      const account = transaction.accounts;
      
      if (!accountGroups[account]) {
        accountGroups[account] = {
          account,
          transactions: [],
          balance: 0
        };
      }
      
      const amount = transaction.debit ? transaction.amount : -transaction.amount;
      accountGroups[account].balance += amount;
      
      // Add to transactions array
      accountGroups[account].transactions.push({
        id: transaction._id.toString(),
        date: transaction.datetime,
        memo: transaction.memo,
        debit: transaction.debit,
        credit: transaction.credit,
        amount: transaction.amount,
        journalId: transaction._journal ? transaction._journal.toString() : null
      });
    }
    
    // Convert to array
    const ledger = Object.values(accountGroups);
    
    // Format response
    const response = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      account: account,
      ledger
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating general ledger:", error);
    return NextResponse.json(
      { error: 'Failed to generate general ledger', details: error.message },
      { status: 500 }
    );
  }
} 