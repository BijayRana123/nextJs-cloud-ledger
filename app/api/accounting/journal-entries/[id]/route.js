import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/accounting';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    // Await the params object to fix the Next.js error
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

    // Convert ID string to MongoDB ObjectId
    let journalId;
    try {
      journalId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid journal entry ID format' },
        { status: 400 }
      );
    }

    // Get direct access to MongoDB collections
    const db = mongoose.connection.db;
    const journalCollection = db.collection('medici_journals');
    const transactionCollection = db.collection('medici_transactions');

    // Find journal directly
    const journalEntry = await journalCollection.findOne({ _id: journalId });

    if (!journalEntry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Find transactions directly
    const transactions = await transactionCollection.find({ _journal: journalId }).toArray();
    
    // Process transactions to ensure proper formatting
    const formattedTransactions = transactions.map(transaction => {
      // Convert IDs to strings for JSON
      const transactionId = transaction._id.toString();
      
      // Ensure amount is a number
      const numAmount = typeof transaction.amount === 'number' 
        ? transaction.amount 
        : Number(transaction.amount) || 0;
      
      // Create account_path if needed
      const account_path = transaction.accounts ? transaction.accounts.split(':') : [];
      
      return {
        ...transaction,
        _id: transactionId,
        amount: numAmount,
        account_path: account_path,
        debit: !!transaction.debit,
        credit: !transaction.debit
      };
    });

    // Combine journal entry with its transactions
    const result = {
      ...journalEntry,
      _id: journalEntry._id.toString(),
      transactions: formattedTransactions,
    };

    return NextResponse.json({ journalEntry: result });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entry' },
      { status: 500 }
    );
  }
} 