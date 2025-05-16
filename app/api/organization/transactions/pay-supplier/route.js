import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentSentEntry } from '@/lib/accounting';
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
    if (!paymentDetails.supplierId || !paymentDetails.amount || !paymentDetails.paymentMethod) {
      return NextResponse.json({ message: 'Missing required payment details.' }, { status: 400 });
    }

    // Ensure amount is a number
    const amount = parseFloat(paymentDetails.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    }

    // Generate a new bill number if one doesn't exist
    if (!paymentDetails.billNumber) {
      try {
        paymentDetails.billNumber = await Counter.getNextSequence('payment_voucher', { 
          prefix: 'BILL-', 
          paddingSize: 4 
        });
      } catch (counterError) {
        console.error("Error generating bill number:", counterError);
        // Fallback to a default format if counter fails
        paymentDetails.billNumber = `BILL-${Date.now().toString().substring(7)}`;
      }
    }

    console.log('Recording supplier payment with details:', {
      ...paymentDetails,
      amount,
      organizationId
    });

    // Create the accounting entry with validated data
    await createPaymentSentEntry({
      ...paymentDetails,
      amount,
      organizationId,
      _id: new mongoose.Types.ObjectId() // Generate a new ID for this payment
    });

    return NextResponse.json({ 
      message: "Payment sent and accounting entry created successfully",
      billNumber: paymentDetails.billNumber 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment sent entry:", error);
    return NextResponse.json({ message: "Failed to create payment sent entry", error: error.message }, { status: 500 });
  }
}
