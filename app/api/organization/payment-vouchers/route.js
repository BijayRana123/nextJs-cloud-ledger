import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentSentEntry } from '@/lib/accounting';
import PaymentVoucher from '@/lib/models/PaymentVoucher';
import AccountingJournal from '@/lib/models/AccountingJournal';
import AccountingTransaction from '@/lib/models/AccountingTransaction';
import Supplier from '@/lib/models/Supplier';

export async function POST(request) {
  await dbConnect();

  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    // Get organization ID from request headers (set by the auth middleware)
    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const paymentDetails = await request.json();

    // Validate incoming data
    if (!paymentDetails.supplierId || !paymentDetails.amount || !paymentDetails.paymentMethod) {
      return NextResponse.json({ message: 'Missing required payment details.' }, { status: 400 });
    }

    // Ensure amount is a number
    const amount = parseFloat(paymentDetails.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    }

    // Get supplier details
    const supplier = await Supplier.findOne({
      _id: paymentDetails.supplierId,
      organization: organizationId
    });

    if (!supplier) {
      return NextResponse.json({ message: 'Supplier not found.' }, { status: 404 });
    }

    // Create the payment voucher document
    const paymentVoucher = new PaymentVoucher({
      supplier: paymentDetails.supplierId,
      amount: amount,
      paymentMethod: paymentDetails.paymentMethod,
      notes: paymentDetails.notes,
      organization: organizationId,
      date: new Date(),
      status: 'APPROVED'
    });

    // Save the payment voucher (this will trigger the pre-save hook to generate the voucher number)
    await paymentVoucher.save();

    if (!paymentVoucher.paymentVoucherNumber) {
      throw new Error('Failed to generate payment voucher number');
    }

    // Create the accounting entry
    await createPaymentSentEntry({
      ...paymentDetails,
      amount,
      organizationId,
      supplierName: supplier.name,
      paymentVoucherNumber: paymentVoucher.paymentVoucherNumber,
      _id: paymentVoucher._id
    });

    // Create the journal voucher
    const journal = new AccountingJournal({
      datetime: new Date(),
      memo: `Payment to ${supplier.name}`,
      book: 'cloud_ledger',
      voucherNumber: paymentVoucher.paymentVoucherNumber,
      organization: organizationId
    });

    await journal.save();

    // Create the transactions
    const transactions = [
      {
        journal: journal._id,
        datetime: journal.datetime,
        account_path: `Liabilities:Current Liabilities:Accounts Payable:${supplier.name}`,
        debit: true,
        credit: false,
        amount: amount,
        organization: organizationId
      },
      {
        journal: journal._id,
        datetime: journal.datetime,
        account_path: 'Assets:Current Assets:Cash and Bank',
        debit: false,
        credit: true,
        amount: amount,
        organization: organizationId
      }
    ];

    await AccountingTransaction.insertMany(transactions);

    return NextResponse.json({ 
      message: "Payment sent and accounting entry created successfully",
      paymentVoucher,
      journalId: journal._id
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment sent entry:", error);
    return NextResponse.json({ 
      message: "Failed to create payment sent entry", 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
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
    const vouchers = await PaymentVoucher.find({ organization: organizationId })
      .populate('supplier', 'name email phoneNumber')
      .sort({ date: -1 });
    return NextResponse.json({ paymentVouchers: vouchers });
  } catch (error) {
    console.error('Error fetching payment vouchers:', error);
    return NextResponse.json({ message: 'Failed to fetch payment vouchers', error: error.message }, { status: 500 });
  }
} 