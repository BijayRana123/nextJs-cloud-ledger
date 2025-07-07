import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentReceivedEntry } from '@/lib/accounting';
import ReceiptVoucher from '@/lib/models/ReceiptVoucher';
import Customer from '@/lib/models/Customer';
import Organization from '@/lib/models/Organization';
import Counter from '@/lib/models/Counter';

export async function POST(request) {
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

    const receiptDetails = await request.json();

    if (!receiptDetails.customerId || !receiptDetails.amount || !receiptDetails.paymentMethod) {
      return NextResponse.json({ message: 'Missing required receipt details.' }, { status: 400 });
    }

    const amount = parseFloat(receiptDetails.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount.' }, { status: 400 });
    }

    const customer = await Customer.findOne({
      _id: receiptDetails.customerId,
      organization: organizationId
    });
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
    }

    // Fetch organization name using organizationId
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;

    // Generate the receipt voucher number using organizationName for the counter
    const counter = await Counter.findOneAndUpdate(
      { name: 'receipt_voucher', organization: organizationName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    if (!counter) {
      throw new Error('Failed to generate receipt voucher counter');
    }
    const receiptVoucherNumber = `RcV-${counter.value.toString().padStart(5, '0')}`;

    // Create the receipt voucher document (use ObjectId for organization)
    const receiptVoucher = new ReceiptVoucher({
      customer: receiptDetails.customerId,
      amount: amount,
      paymentMethod: receiptDetails.paymentMethod,
      notes: receiptDetails.notes,
      organization: organizationId,
      date: new Date(),
      receiptVoucherNumber
    });

    await receiptVoucher.save();

    if (!receiptVoucher.receiptVoucherNumber) {
      throw new Error('Failed to generate receipt voucher number');
    }

    await createPaymentReceivedEntry({
      ...receiptDetails,
      amount,
      customerName: customer.name,
      receiptVoucherNumber: receiptVoucher.receiptVoucherNumber,
      _id: receiptVoucher._id
    }, organizationId, organizationName);

    return NextResponse.json({ 
      message: "Receipt voucher created successfully",
      _id: receiptVoucher._id,
      receiptVoucher
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating receipt voucher:", error);
    return NextResponse.json({ 
      message: "Failed to create receipt voucher", 
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
    const vouchers = await ReceiptVoucher.find({ organization: organizationId })
      .populate('customer', 'name email phoneNumber')
      .sort({ date: -1 });
    return NextResponse.json({ receiptVouchers: vouchers });
  } catch (error) {
    console.error('Error fetching receipt vouchers:', error);
    return NextResponse.json({ message: 'Failed to fetch receipt vouchers', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found.' }, { status: 400 });
    }
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'ID is required.' }, { status: 400 });
    }
    // Delete the receipt voucher
    const deleted = await ReceiptVoucher.findOneAndDelete({ _id: id, organization: organizationId });
    if (!deleted) {
      return NextResponse.json({ message: 'Receipt voucher not found' }, { status: 404 });
    }
    // Optionally, delete the related journal entry in medici_journals
    // (Assumes receiptVoucherNumber is stored in voucherNumber or meta)
    const mongoose_ = require('mongoose');
    const journalModel = mongoose_.models.Medici_Journal || mongoose_.model('Medici_Journal', new mongoose_.Schema({
      voucherNumber: String
    }, { collection: 'medici_journals' }));
    await journalModel.deleteMany({ voucherNumber: id });
    return NextResponse.json({ message: 'Receipt voucher and related journal entry deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting receipt voucher:', error);
    return NextResponse.json({ message: 'Failed to delete receipt voucher', error: error.message }, { status: 500 });
  }
} 