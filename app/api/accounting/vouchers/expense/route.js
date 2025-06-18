import { NextResponse } from 'next/server';
import { connectToDatabase, createExpenseEntry, getJournalEntries } from '@/lib/accounting';
import mongoose from 'mongoose';

// Handler for POST requests - creating new expense vouchers
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.expenseType || !data.description || !data.paymentMethod || !data.amount) {
      return NextResponse.json(
        { error: 'Expense type, description, payment method, and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Ensure amount is a number
    data.amount = Number(data.amount);
    
    // Generate an ID if not provided
    if (!data._id) {
      data._id = new mongoose.Types.ObjectId().toString();
    }

    // Create journal voucher
    try {
      const result = await createExpenseEntry(data);
      
      return NextResponse.json({
        message: 'Expense voucher created successfully',
        journalEntry: result,
      });
    } catch (error) {
      console.error('Error creating expense voucher:', error);
      return NextResponse.json(
        { error: `Failed to create expense voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing expense voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process expense voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving expense vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const expenseType = searchParams.get('expenseType');

    // Build query object for filtering journal entries
    const query = {
      'memo': { $regex: 'Expense:', $options: 'i' }
    };
    
    // Add expense type filter if provided
    if (expenseType) {
      query['transactions.accounts'] = { $regex: `expenses:${expenseType}`, $options: 'i' };
    }
    
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

    // Options for pagination
    const options = {
      page,
      perPage: limit,
    };

    // Get journal entries
    const journalEntries = await getJournalEntries(query, options);

    return NextResponse.json({
      expenseVouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching expense vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense vouchers' },
      { status: 500 }
    );
  }
} 