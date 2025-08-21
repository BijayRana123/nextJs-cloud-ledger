import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentReceivedEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';
import mongoose from 'mongoose';
import { generateVoucherNumber } from '@/lib/accounting';
import Customer from '@/lib/models/Customer';

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

    // Validate incoming data as needed
    if (!paymentDetails.customerId || !paymentDetails.amount || !paymentDetails.paymentMethod) {
      return NextResponse.json({ message: 'Missing required payment details.' }, { status: 400 });
    }

    // Ensure amount is a number
    const amount = parseFloat(paymentDetails.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    }



    // Fetch customer name
    const customer = await Customer.findOne({ _id: paymentDetails.customerId, organization: organizationId });
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
    }
    const customerName = customer.name;
    // Use customer name in memo
    const memo = `Payment Received from Customer ${customerName}`;
    const receiptVoucherNumber = await generateVoucherNumber(memo, organizationId);

    // Create the accounting entry with validated data
    const journal = await createPaymentReceivedEntry({
      ...paymentDetails,
      amount,
      receiptVoucherNumber,
      customerName,
      paymentMethod: paymentDetails.paymentMethod,
      organizationId,
      _id: new mongoose.Types.ObjectId()
    });

    return NextResponse.json({ 
      message: "Payment received and accounting entry created successfully",
      receiptVoucherNumber,
      journalId: journal && journal._id ? journal._id : undefined
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment received entry:", error);
    return NextResponse.json({ message: "Failed to create payment received entry", error: error.message }, { status: 500 });
  }
}
