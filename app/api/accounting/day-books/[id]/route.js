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
        { error: 'Day book entry ID is required' },
        { status: 400 }
      );
    }

    // Convert ID string to MongoDB ObjectId
    let dayBookId;
    try {
      dayBookId = new mongoose.Types.ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid day book entry ID format' },
        { status: 400 }
      );
    }

    // Get direct access to MongoDB collections
    const db = mongoose.connection.db;
    const dayBookCollection = db.collection('medici_journals');
    const transactionCollection = db.collection('medici_transactions');

    // Find day book directly
    const dayBookEntry = await dayBookCollection.findOne({ _id: dayBookId });

    if (!dayBookEntry) {
      return NextResponse.json(
        { error: 'Day book entry not found' },
        { status: 404 }
      );
    }

    // Find transactions directly
    const transactions = await transactionCollection.find({ _journal: dayBookId }).toArray();
    
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

    // Combine day book entry with its transactions
    const result = {
      ...dayBookEntry,
      _id: dayBookEntry._id.toString(),
      transactions: formattedTransactions,
    };

    return NextResponse.json({ dayBookEntry: result });
  } catch (error) {
    console.error('Error fetching day book entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day book entry' },
      { status: 500 }
    );
  }
} 