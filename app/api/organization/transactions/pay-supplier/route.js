import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createPaymentSentEntry } from '@/lib/accounting';

export async function POST(request) {
  await dbConnect();

  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const paymentDetails = await request.json();

    // Validate incoming data as needed
    if (!paymentDetails.supplierId || !paymentDetails.amount || !paymentDetails.paymentMethod) {
        return NextResponse.json({ message: 'Missing required payment details.' }, { status: 400 });
    }

    // Create the accounting entry
    await createPaymentSentEntry(paymentDetails);

    return NextResponse.json({ message: "Payment sent and accounting entry created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating payment sent entry:", error);
    return NextResponse.json({ message: "Failed to create payment sent entry", error: error.message }, { status: 500 });
  }
}
