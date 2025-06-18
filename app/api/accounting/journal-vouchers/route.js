import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AccountingService from '@/lib/services/AccountingService';
import { protect } from '@/lib/middleware/auth';
import mongoose from 'mongoose';
import { getJournalEntries } from '@/lib/accounting';

export async function POST(request) {
  try {
    await dbConnect();
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const { memo, transactions } = await request.json();

    if (!memo || !transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid journal voucher data. Memo and transactions are required.' },
        { status: 400 }
      );
    }

    // Validate all transaction amounts are proper numbers and positive
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

    // Convert all amounts to numbers for consistency
    const validatedEntries = transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount) // Ensure amount is float
    }));

    // Check if debits equal credits
    const totalDebits = validatedEntries
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCredits = validatedEntries
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) { // Allow small rounding differences
      return NextResponse.json(
        { error: 'Debits must equal credits. Please check your transaction amounts.' },
        { status: 400 }
      );
    }

    // Prepare data for AccountingService.recordJournalVoucher
    const entryData = {
      memo,
      entries: validatedEntries, // Map 'transactions' to 'entries'
      date: new Date(), // Use current date for the voucher
      organizationId: organizationId // Pass organization ID
    };

    const result = await AccountingService.recordJournalVoucher(entryData);

    return NextResponse.json({
      message: 'Journal voucher created successfully',
      journalVoucher: result // 'result' contains the journal details including voucherNumber
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating journal voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create journal voucher: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('searchTerm');

    // Build query to fetch only general journal vouchers (those with JV- prefix)
    const query = {
      book: 'cloud_ledger',
      voucherNumber: { $regex: '^JV-', $options: 'i' },
      organization: organizationId
    };

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

    if (searchTerm) {
      query.memo = { $regex: searchTerm, $options: 'i' };
    }

    const options = {
      page,
      perPage: limit,
    };

    const journalVouchers = await getJournalEntries(query, options);

    // Get total count for pagination
    let totalCount = 0;
    try {
      const journalModel = mongoose.model('Medici_Journal');
      totalCount = await journalModel.countDocuments(query);
    } catch (countError) {
      console.error('Error counting journal vouchers:', countError);
    }

    return NextResponse.json({
      journalVouchers: journalVouchers,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
    });

  } catch (error) {
    console.error('Error fetching journal vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal vouchers: ' + error.message },
      { status: 500 }
    );
  }
} 