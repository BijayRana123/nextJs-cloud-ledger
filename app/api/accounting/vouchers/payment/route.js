import { NextResponse } from 'next/server';
import { connectToDatabase, createPaymentSentEntry, getJournalEntries } from '@/lib/accounting';

// Handler for POST requests - creating new payment vouchers
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.supplierId || !data.paymentMethod || !data.amount) {
      return NextResponse.json(
        { error: 'Supplier ID, payment method, and amount are required' },
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
      const result = await createPaymentSentEntry(data, data.organizationId || request.organizationId);
      
      return NextResponse.json({
        message: 'Payment voucher created successfully',
        journalEntry: result,
      });
    } catch (error) {
      console.error('Error creating payment voucher:', error);
      return NextResponse.json(
        { error: `Failed to create payment voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing payment voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process payment voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving payment vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');

    // Build query object for filtering journal entries
    const query = {
      'memo': { $regex: 'Payment Sent to Supplier', $options: 'i' }
    };
    
    // Add supplier filter if provided
    if (supplierId) {
      query['transactions.meta.supplierId'] = supplierId;
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
      paymentVouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching payment vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment vouchers' },
      { status: 500 }
    );
  }
} 
