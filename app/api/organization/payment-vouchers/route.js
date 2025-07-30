import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentSentEntry } from '@/lib/accounting';
import PaymentVoucher from '@/lib/models/PaymentVoucher';
import AccountingJournal from '@/lib/models/AccountingJournal';
import AccountingTransaction from '@/lib/models/AccountingTransaction';
import Supplier from '@/lib/models/Supplier';
import Organization from '@/lib/models/Organization';
import Counter from '@/lib/models/Counter';

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

    // Fetch organization name using organizationId
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;

    // Create the payment voucher document (use ObjectId for organization)
    const paymentVoucher = new PaymentVoucher({
      supplier: paymentDetails.supplierId,
      amount: amount,
      paymentMethod: paymentDetails.paymentMethod,
      notes: paymentDetails.notes,
      organization: organizationId, // ObjectId here
      date: new Date()
    });

    // Generate the payment voucher number using organizationName for the counter
    const counter = await Counter.findOneAndUpdate(
      { name: 'payment_voucher', organization: organizationName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    if (!counter) {
      throw new Error('Failed to generate payment voucher counter');
    }
    const paymentVoucherNumber = `PaV-${counter.value.toString().padStart(5, '0')}`;
    paymentVoucher.paymentVoucherNumber = paymentVoucherNumber;

    // Save the payment voucher
    await paymentVoucher.save();

    // Ensure organizationId is a string (hex) for accounting logic
    let orgIdString = organizationId;
    if (typeof orgIdString === 'object' && orgIdString !== null) {
      if (orgIdString._id) {
        orgIdString = orgIdString._id.toString();
      } else if (orgIdString.toString) {
        orgIdString = orgIdString.toString();
      }
    }

    // Create the accounting entry (use organizationName for counter logic)
    await createPaymentSentEntry({
      ...paymentDetails,
      amount,
      supplierName: supplier.name,
      paymentVoucherNumber: paymentVoucherNumber,
      _id: paymentVoucher._id
    }, orgIdString, organizationName);

    // Fetch the saved payment voucher with populated fields
    const savedVoucher = await PaymentVoucher.findById(paymentVoucher._id)
      .populate('supplier')
      .populate('organization');

    return NextResponse.json(savedVoucher, { status: 201 });

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
