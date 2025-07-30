import { NextResponse } from 'next/server';
import { connectToDatabase, createOtherIncomeEntry, getJournalEntries } from '@/lib/accounting';
import mongoose from 'mongoose';

// Handler for POST requests - creating new income vouchers
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.incomeType || !data.description || !data.receiptMethod || !data.amount) {
      return NextResponse.json(
        { error: 'Income type, description, receipt method, and amount are required' },
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
      const result = await createOtherIncomeEntry(data, data.organizationId || request.organizationId);
      
      return NextResponse.json({
        message: 'Income voucher created successfully',
        journalEntry: result,
      });
    } catch (error) {
      console.error('Error creating income voucher:', error);
      return NextResponse.json(
        { error: `Failed to create income voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing income voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process income voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving income vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const incomeType = searchParams.get('incomeType');

    // Build query object for filtering journal entries
    const query = {
      'memo': { $regex: 'Other Income:', $options: 'i' }
    };
    
    // Add income type filter if provided
    if (incomeType) {
      query['transactions.accounts'] = { $regex: `income:${incomeType}`, $options: 'i' };
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
      incomeVouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching income vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income vouchers' },
      { status: 500 }
    );
  }
} 
