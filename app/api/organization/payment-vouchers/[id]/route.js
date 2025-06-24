import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PaymentVoucher from '@/lib/models/PaymentVoucher';
import AccountingJournal from '@/lib/models/AccountingJournal';
import AccountingTransaction from '@/lib/models/AccountingTransaction';
import { protect } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found' }, { status: 400 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Payment Voucher ID' }, { status: 400 });
    }

    const paymentVoucher = await PaymentVoucher.findOne({ _id: id, organization: organizationId })
      .populate('supplier', 'name email phoneNumber')
      .lean();

    if (!paymentVoucher) {
      return NextResponse.json({ message: 'Payment voucher not found' }, { status: 404 });
    }

    const linkingTransaction = await mongoose.connection.db.collection('medici_transactions').findOne({
      "meta.paymentVoucherId": new mongoose.Types.ObjectId(id)
    });

    let transactions = [];
    if (linkingTransaction) {
      const journalId = linkingTransaction._journal;
      transactions = await mongoose.connection.db.collection('medici_transactions').find({ _journal: journalId }).toArray();
    }

    const supplierName = paymentVoucher.supplier?.name || 'N/A';
    const memo = `Payment to ${supplierName}`;

    return NextResponse.json({
      paymentVoucher: {
        ...paymentVoucher,
        supplierName,
        memo,
        transactions: transactions.map(t => ({
          account: t.accounts,
          amount: t.amount,
          type: t.debit ? 'Debit' : 'Credit'
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching payment voucher:', error);
    return NextResponse.json({ message: 'Failed to fetch payment voucher details' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found' }, { status: 400 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Payment Voucher ID' }, { status: 400 });
    }

    const linkingTransaction = await mongoose.connection.db.collection('medici_transactions').findOne({
      "meta.paymentVoucherId": new mongoose.Types.ObjectId(id)
    });

    if (linkingTransaction) {
      const journalId = linkingTransaction._journal;
      await mongoose.connection.db.collection('medici_transactions').deleteMany({ _journal: journalId });
      await mongoose.connection.db.collection('medici_journals').deleteOne({ _id: journalId });
    }

    await PaymentVoucher.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Payment voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment voucher:', error);
    return NextResponse.json({ message: 'Failed to delete payment voucher', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.json(
        { message: 'No organization context found' },
        { status: 400 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { message: 'Payment voucher ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { supplierId, amount, paymentMethod, notes } = body;

    // Update the payment voucher
    const updated = await PaymentVoucher.findOneAndUpdate(
      { _id: id, organization: organizationId },
      {
        ...(supplierId && { supplier: supplierId }),
        ...(amount !== undefined && { amount }),
        ...(paymentMethod && { paymentMethod }),
        ...(notes && { notes }),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { message: 'Payment voucher not found' },
        { status: 404 }
      );
    }

    // Optionally update the related journal and transactions here if needed
    // (not implemented for brevity)

    return NextResponse.json({ paymentVoucher: updated });
  } catch (error) {
    console.error('Error updating payment voucher:', error);
    return NextResponse.json(
      { message: 'Failed to update payment voucher', error: error.message },
      { status: 500 }
    );
  }
}

// --- BACKFILL SCRIPT (run manually if needed) ---
// To use: import and call backfillPaymentVoucherJournalIds() in a script or dev route
export async function backfillPaymentVoucherJournalIds() {
  await dbConnect();
  const PaymentVoucher = (await import('@/lib/models/PaymentVoucher')).default;
  const mongoose_ = require('mongoose');
  const MediciJournal = mongoose_.models.Medici_Journal || mongoose_.model('Medici_Journal', new mongoose_.Schema({
    voucherNumber: String
  }, { collection: 'medici_journals' }));
  const vouchers = await PaymentVoucher.find({ journalId: { $exists: false } });
  let updated = 0;
  for (const voucher of vouchers) {
    const journal = await MediciJournal.findOne({ voucherNumber: voucher.paymentVoucherNumber });
    if (journal) {
      voucher.journalId = journal._id;
      await voucher.save();
      updated++;
    }
  }
  console.log(`Backfilled ${updated} payment vouchers with journalId.`);
}

// --- BACKFILL SCRIPT (run manually if needed) ---
// To use: import and call backfillMediciJournalVoucherNumbers() in a script or dev route
export async function backfillMediciJournalVoucherNumbers() {
  await dbConnect();
  const PaymentVoucher = (await import('@/lib/models/PaymentVoucher')).default;
  const mongoose_ = require('mongoose');
  const MediciJournal = mongoose_.models.Medici_Journal || mongoose_.model('Medici_Journal', new mongoose_.Schema({
    voucherNumber: String,
    memo: String,
    datetime: Date
  }, { collection: 'medici_journals' }));
  const vouchers = await PaymentVoucher.find({ paymentVoucherNumber: { $exists: true } });
  let updated = 0;
  for (const voucher of vouchers) {
    // Try to find a journal by close datetime and memo
    const journal = await MediciJournal.findOne({
      memo: { $regex: voucher.supplier ? voucher.supplier.toString() : '', $options: 'i' },
      datetime: { $gte: new Date(voucher.date.getTime() - 60000), $lte: new Date(voucher.date.getTime() + 60000) }
    });
    if (journal && !journal.voucherNumber) {
      journal.voucherNumber = voucher.paymentVoucherNumber;
      await journal.save();
      updated++;
    }
  }
  console.log(`Backfilled ${updated} medici journals with voucherNumber.`);
} 