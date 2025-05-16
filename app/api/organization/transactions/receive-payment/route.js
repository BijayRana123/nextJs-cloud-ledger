import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentReceivedEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';
import mongoose from 'mongoose';

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

    // Generate a new invoice number if one doesn't exist
    if (!paymentDetails.invoiceNumber) {
      try {
        paymentDetails.invoiceNumber = await Counter.getNextSequence('receipt_voucher', { 
          prefix: 'INV-', 
          paddingSize: 4 
        });
      } catch (counterError) {
        console.error("Error generating invoice number:", counterError);
        // Fallback to a default format if counter fails
        paymentDetails.invoiceNumber = `INV-${Date.now().toString().substring(7)}`;
      }
    }

    console.log('Recording payment receipt with details:', {
      ...paymentDetails,
      amount,
      organizationId
    });

    // Create the accounting entry with validated data
    await createPaymentReceivedEntry({
      ...paymentDetails,
      amount,
      organizationId,
      _id: new mongoose.Types.ObjectId() // Generate a new ID for this payment
    });

    return NextResponse.json({ 
      message: "Payment received and accounting entry created successfully",
      invoiceNumber: paymentDetails.invoiceNumber 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment received entry:", error);
    return NextResponse.json({ message: "Failed to create payment received entry", error: error.message }, { status: 500 });
  }
}
