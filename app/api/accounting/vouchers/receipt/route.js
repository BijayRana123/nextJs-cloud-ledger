import { NextResponse } from 'next/server';
import { connectToDatabase, createPaymentReceivedEntry, getJournalEntries } from '@/lib/accounting';

// Handler for POST requests - creating new receipt vouchers
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.customerId || !data.paymentMethod || !data.amount) {
      return NextResponse.json(
        { error: 'Customer ID, payment method, and amount are required' },
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

    // Create journal voucher
    try {
      const result = await createPaymentReceivedEntry(data);
      
      return NextResponse.json({
        message: 'Receipt voucher created successfully',
        journalEntry: result,
      });
    } catch (error) {
      console.error('Error creating receipt voucher:', error);
      return NextResponse.json(
        { error: `Failed to create receipt voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing receipt voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving receipt vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');

    // Build query object for filtering journal entries
    const query = {
      'memo': { $regex: 'Payment Received from Customer', $options: 'i' }
    };
    
    // Add customer filter if provided
    if (customerId) {
      query['transactions.meta.customerId'] = customerId;
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
      receiptVouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching receipt vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt vouchers' },
      { status: 500 }
    );
  }
} 