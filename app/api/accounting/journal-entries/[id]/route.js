import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/accounting';
import { JournalVoucher } from '@/lib/models';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // Await params if needed (for Next.js 13+)
    const id = params?.id || (typeof params === 'function' ? (await params()).id : undefined);
    if (!id) {
      return NextResponse.json({ error: 'Journal entry ID is required' }, { status: 400 });
    }

    // Try to find a JournalVoucher first
    let journalVoucher = null;
    try {
      journalVoucher = await JournalVoucher.findById(id).lean();
    } catch (e) {}
    if (journalVoucher) {
      // Format to match frontend expectations
      return NextResponse.json({
        _id: journalVoucher._id,
        voucherNumber: journalVoucher.referenceNo,
        datetime: journalVoucher.date,
        memo: journalVoucher.memo,
        transactions: (journalVoucher.transactions || []).map(t => ({
          ...t,
          debit: t.type === 'debit',
          credit: t.type === 'credit',
        })),
        notes: journalVoucher.notes,
        status: journalVoucher.status,
        type: 'JournalVoucher',
      });
    }

    // Fallback to Medici journal logic
    const journalModel = mongoose.models.Medici_Journal || 
      mongoose.model('Medici_Journal', new mongoose.Schema({
        datetime: Date,
        memo: String,
        voided: Boolean,
        void_reason: String,
        book: String,
        voucherNumber: String,
        _transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Transaction' }]
      }, { collection: 'medici_journals' }));

    const transactionModel = mongoose.models.Medici_Transaction ||
      mongoose.model('Medici_Transaction', new mongoose.Schema({
        _journal: { type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Journal' },
        datetime: { type: Date, default: Date.now },
        accounts: { type: String, required: true },
        book: { type: String, default: 'cloud_ledger' },
        memo: { type: String, default: '' },
        debit: { type: Boolean, required: true },
        credit: { type: Boolean, required: true },
        amount: { type: Number, required: true },
        voided: { type: Boolean, default: false },
        meta: { type: Object, default: {} }
      }, { collection: 'medici_transactions' }));

    const journal = await journalModel.findById(id).lean();
    if (!journal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }
    const transactions = await transactionModel.find({ _journal: id }).lean();
    const response = {
      ...journal,
      transactions: transactions.map(t => ({
        ...t,
        type: t.debit ? 'debit' : 'credit',
      })),
      type: 'MediciJournal',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { error: `Failed to fetch journal entry: ${error.message}` },
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