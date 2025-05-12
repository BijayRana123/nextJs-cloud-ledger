import { NextResponse } from 'next/server';
import { 
  connectToDatabase, 
  createOwnerInvestmentEntry, 
  createOwnerDrawingsEntry, 
  getJournalEntries 
} from '@/lib/accounting';
import mongoose from 'mongoose';

// Handler for POST requests - creating new owner vouchers (investment or drawings)
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    const { type } = data;
    
    // Validate voucher type
    if (!type || (type !== 'investment' && type !== 'drawings')) {
      return NextResponse.json(
        { error: 'Valid type (investment or drawings) is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!data.method || !data.amount) {
      return NextResponse.json(
        { error: 'Method and amount are required' },
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

    // Create journal entry based on type
    try {
      let result;
      
      if (type === 'investment') {
        result = await createOwnerInvestmentEntry(data);
      } else {
        result = await createOwnerDrawingsEntry(data);
      }
      
      return NextResponse.json({
        message: `Owner ${type} voucher created successfully`,
        journalEntry: result,
      });
    } catch (error) {
      console.error(`Error creating owner ${type} voucher:`, error);
      return NextResponse.json(
        { error: `Failed to create owner ${type} voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing owner voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process owner voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving owner vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'investment' or 'drawings'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query object for filtering journal entries
    const query = {};
    
    // Filter by type if provided
    if (type === 'investment') {
      query.memo = 'Owner Investment';
    } else if (type === 'drawings') {
      query.memo = 'Owner Drawings';
    } else {
      query.memo = { $in: ['Owner Investment', 'Owner Drawings'] };
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
      ownerVouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching owner vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner vouchers' },
      { status: 500 }
    );
  }
} 