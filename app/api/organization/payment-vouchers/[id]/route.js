import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PaymentVoucher from '@/lib/models/PaymentVoucher';
import AccountingJournal from '@/lib/models/AccountingJournal';
import AccountingTransaction from '@/lib/models/AccountingTransaction';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
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

    // Find the payment voucher
    const paymentVoucher = await PaymentVoucher.findOne({
      _id: id,
      organization: organizationId
    }).populate('supplier', 'name email phoneNumber');

    if (!paymentVoucher) {
      return NextResponse.json(
        { message: 'Payment voucher not found' },
        { status: 404 }
      );
    }

    // Find the associated journal entry
    const journal = await AccountingJournal.findOne({
      voucherNumber: paymentVoucher.paymentVoucherNumber,
      organization: organizationId
    });

    // Find the associated transactions
    let transactions = journal ? await AccountingTransaction.find({
      journal: journal._id,
      organization: organizationId
    }) : [];

    // Add type (Debit/Credit) and account name to each transaction
    transactions = transactions.map(t => ({
      ...t.toObject(),
      type: t.debit ? 'Debit' : (t.credit ? 'Credit' : ''),
      account: t.account_path || t.account || 'N/A'
    }));

    // Prepare supplier name and payment method for easy access
    const supplierName = paymentVoucher.supplier?.name || 'N/A';
    const paymentMethod = paymentVoucher.paymentMethod || 'N/A';

    // Memo with supplier name
    const memo = `Payment to ${supplierName}`;

    return NextResponse.json({
      paymentVoucher: {
        ...paymentVoucher.toObject(),
        supplierName,
        paymentMethod,
        memo
      },
      journal,
      transactions
    });
  } catch (error) {
    console.error('Error fetching payment voucher:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment voucher details' },
      { status: 500 }
    );
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

    const deleted = await PaymentVoucher.findOneAndDelete({ _id: id, organization: organizationId });
    if (!deleted) {
      return NextResponse.json(
        { message: 'Payment voucher not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Payment voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment voucher:', error);
    return NextResponse.json(
      { message: 'Failed to delete payment voucher', error: error.message },
      { status: 500 }
    );
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