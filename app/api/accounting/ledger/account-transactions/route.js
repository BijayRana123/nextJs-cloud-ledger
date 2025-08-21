import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

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

    // Parse request body
    const body = await request.json();
    const { organizationId, accountPath, startDate, endDate } = body;

    // Validate required parameters
    if (!organizationId || !accountPath) {
      return NextResponse.json(
        { error: 'Organization ID and account path are required' },
        { status: 400 }
      );
    }

    const startDateTime = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDateTime = endDate ? new Date(endDate) : new Date();

    // Get the transaction collection directly
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');

    // Build query for transactions
    const query = {
      accounts: accountPath,
      voided: false,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      datetime: { 
        $gte: startDateTime,
        $lte: endDateTime 
      }
    };

    // Get transactions sorted by date (newest first)
    const transactions = await transactionCollection
      .find(query)
      .sort({ datetime: -1 })
      .limit(1000) // Limit to prevent performance issues
      .toArray();

    // Calculate summary statistics
    let totalDebits = 0;
    let totalCredits = 0;
    let debitCount = 0;
    let creditCount = 0;

    transactions.forEach(txn => {
      if (txn.debit) {
        totalDebits += txn.amount;
        debitCount++;
      } else if (txn.credit) {
        totalCredits += txn.amount;
        creditCount++;
      }
    });

    // Format response
    const response = {
      accountPath,
      period: {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      },
      transactions: transactions.map(txn => ({
        _id: txn._id,
        datetime: txn.datetime,
        description: txn.memo || txn.description,
        memo: txn.memo,
        reference: txn.reference,
        voucherNumber: txn.voucherNumber,
        amount: txn.amount,
        debit: txn.debit,
        credit: txn.credit,
        journalId: txn.journal,
        voided: txn.voided
      })),
      summary: {
        totalTransactions: transactions.length,
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        netAmount: Math.round((totalCredits - totalDebits) * 100) / 100,
        debitCount,
        creditCount
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Error fetching account transactions:", error);
    return NextResponse.json(
      { error: 'Failed to fetch account transactions', details: error.message },
      { status: 500 }
    );
  }
}