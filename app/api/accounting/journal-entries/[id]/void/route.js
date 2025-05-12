import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getBook } from '@/lib/accounting';

export async function POST(request, { params }) {
  try {
    // Ensure MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database connection not established' },
        { status: 500 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

    // Get the reason for voiding
    const data = await request.json();
    const { reason } = data;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason for voiding is required' },
        { status: 400 }
      );
    }

    try {
      // Get the book instance
      const book = await getBook();
      
      // Void the journal entry
      const result = await book.void(id, reason);

      // Get the updated journal entry with its transactions
      const journalModel = mongoose.model('Medici_Journal');
      const journalEntry = await journalModel.findById(id).lean();
      
      const transactionModel = mongoose.model('Medici_Transaction');
      const transactions = await transactionModel.find({ _journal: id }).lean();

      // Ensure all transactions have properly formatted fields
      const formattedTransactions = transactions.map(transaction => ({
        ...transaction,
        amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
        account_path: Array.isArray(transaction.account_path) ? transaction.account_path : 
          (transaction.accounts ? transaction.accounts.split(':') : []),
        debit: !!transaction.debit,
        credit: !transaction.debit
      }));

      // Combine journal entry with its transactions
      const updatedJournalEntry = {
        ...journalEntry,
        transactions: formattedTransactions,
      };

      return NextResponse.json({
        message: 'Journal entry voided successfully',
        journalEntry: updatedJournalEntry,
      });
    } catch (error) {
      console.error('Error voiding journal entry:', error);
      return NextResponse.json(
        { error: `Failed to void journal entry: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing void request:', error);
    return NextResponse.json(
      { error: 'Failed to process void request' },
      { status: 500 }
    );
  }
} 