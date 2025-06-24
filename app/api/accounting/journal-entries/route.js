import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/medici_test';

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoConnectionString);
}

export async function GET(request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const searchTerm = searchParams.get('searchTerm') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const skip = (page - 1) * limit;
  const id = searchParams.get('_id');

  // Get the journal and transaction models
  const journalModel = mongoose.models.Medici_Journal || mongoose.model('Medici_Journal', new mongoose.Schema({
    datetime: Date,
    memo: String,
    voided: Boolean,
    void_reason: String,
    book: String,
    voucherNumber: String,
    _transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Transaction' }]
  }, { collection: 'medici_journals' }));
  const transactionModel = mongoose.models.Medici_Transaction || mongoose.model('Medici_Transaction', new mongoose.Schema({
    _journal: { type: mongoose.Schema.Types.ObjectId, ref: 'Medici_Journal' },
    datetime: Date,
    accounts: String,
    book: String,
    memo: String,
    debit: Boolean,
    credit: Boolean,
    amount: Number,
    voided: Boolean,
    meta: Object
  }, { collection: 'medici_transactions' }));

  // Build query
  let query = {};
  if (id) {
    query = { _id: new mongoose.Types.ObjectId(id) };
  } else if (searchTerm) {
    query.$or = [
      { memo: { $regex: searchTerm, $options: 'i' } },
      { voucherNumber: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  try {
    let entries;
    let total = 0;
    if (id) {
      const journal = await journalModel.findOne(query).lean();
      if (journal) {
        const transactions = await transactionModel.find({ _journal: journal._id }).lean();
        journal.transactions = transactions;
        entries = [journal];
        total = 1;
      } else {
        entries = [];
        total = 0;
      }
    } else {
      total = await journalModel.countDocuments(query);
      const journals = await journalModel.find(query)
        .sort({ datetime: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      entries = await Promise.all(journals.map(async (journal) => {
        const transactions = await transactionModel.find({ _journal: journal._id }).lean();
        journal.transactions = transactions;
        return journal;
      }));
    }
    return NextResponse.json({ journalEntries: entries, total });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries', journalEntries: [] }, { status: 500 });
  }
} 