import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ReceiptVoucher from '@/lib/models/ReceiptVoucher';
import { protect } from '@/lib/middleware/auth';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/accounting';

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found.' }, { status: 400 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Receipt Voucher ID' }, { status: 400 });
    }

    const voucher = await ReceiptVoucher.findOne({ _id: id, organization: organizationId })
      .populate('customer', 'name email phoneNumber')
      .lean();

    if (!voucher) {
      return NextResponse.json({ message: 'Receipt voucher not found' }, { status: 404 });
    }

    await connectToDatabase();
    const linkingTransaction = await mongoose.connection.db.collection('medici_transactions').findOne({
      "meta.receiptVoucherId": new mongoose.Types.ObjectId(id)
    });

    let transactions = [];
    if (linkingTransaction) {
      const journalId = linkingTransaction._journal;
      transactions = await mongoose.connection.db.collection('medici_transactions').find({ _journal: journalId }).toArray();
    }

    const receiptVoucher = {
        ...voucher,
        transactions: transactions.map(t => ({
          account: t.accounts,
          amount: t.amount,
          type: t.debit ? 'Debit' : 'Credit'
        })),
    };

    return NextResponse.json({ receiptVoucher });
  } catch (error) {
    console.error('Error fetching receipt voucher:', error);
    return NextResponse.json({ message: 'Failed to fetch receipt voucher', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found.' }, { status: 400 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid Receipt Voucher ID' }, { status: 400 });
    }

    const voucher = await ReceiptVoucher.findOne({ _id: id, organization: organizationId });

    if (!voucher) {
        return NextResponse.json({ message: 'Receipt voucher not found' }, { status: 404 });
    }

    // Delete journal entry and transactions
    await connectToDatabase();
    const journal = await mongoose.connection.db.collection('medici_journals').findOne({ "transactions.meta.receiptVoucherId": new mongoose.Types.ObjectId(id) });
    if (journal) {
      await mongoose.connection.db.collection('medici_transactions').deleteMany({ _journal: journal._id });
      await mongoose.connection.db.collection('medici_journals').deleteOne({ _id: journal._id });
    }
    
    // Delete receipt voucher
    await ReceiptVoucher.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Receipt voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt voucher:', error);
    return NextResponse.json({ message: 'Failed to delete receipt voucher', error: error.message }, { status: 500 });
  }
} 