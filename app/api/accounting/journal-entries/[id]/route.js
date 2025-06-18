import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/accounting';

export async function GET(request, context) {
  try {
    await connectToDatabase();
    const params = await context.params;
    const id = params?.id;
    console.log('Fetching journal entry with id:', id, 'type:', typeof id);

    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

    // Try as ObjectId
    let entryId;
    let journalEntry = null;
    try {
      entryId = new mongoose.Types.ObjectId(id);
      journalEntry = await mongoose.connection.db.collection('accounting_journals').findOne({ _id: entryId });
      console.log('Result with ObjectId:', journalEntry);
    } catch (error) {
      console.log('Error converting to ObjectId or querying with ObjectId:', error);
    }

    // If not found, try as string
    if (!journalEntry) {
      journalEntry = await mongoose.connection.db.collection('accounting_journals').findOne({ _id: id });
      console.log('Result with string id:', journalEntry);
    }

    if (!journalEntry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Find transactions directly
    const transactionCollection = mongoose.connection.db.collection('accounting_transactions');
    const transactions = await transactionCollection.find({ journal: journalEntry._id }).toArray();
    
    // Process transactions to ensure proper formatting
    const formattedTransactions = transactions.map(transaction => {
      const transactionId = transaction._id.toString();
      const numAmount = typeof transaction.amount === 'number' 
        ? transaction.amount 
        : Number(transaction.amount) || 0;
      const account_path = transaction.account_path ? transaction.account_path.split(':') : [];
      return {
        ...transaction,
        _id: transactionId,
        amount: numAmount,
        account_path: account_path,
        debit: !!transaction.debit,
        credit: !!transaction.credit
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

export async function DELETE(request, context) {
  try {
    await connectToDatabase();
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }
    let entryId = id;
    try {
      entryId = new mongoose.Types.ObjectId(id);
    } catch (e) {}
    const journalCollection = mongoose.connection.db.collection('accounting_journals');
    const transactionCollection = mongoose.connection.db.collection('accounting_transactions');
    // Delete the journal entry
    const deleteResult = await journalCollection.deleteOne({ _id: entryId });
    // Delete related transactions
    await transactionCollection.deleteMany({ journal: entryId });
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Journal entry not found or already deleted' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Journal entry deleted' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
} 