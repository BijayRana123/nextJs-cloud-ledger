import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createExpenseEntry } from '@/lib/accounting';
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

    const expenseDetails = await request.json();

    // Validate incoming data as needed
    if (!expenseDetails.expenseType || !expenseDetails.amount || !expenseDetails.description || !expenseDetails.paymentMethod) {
        return NextResponse.json({ message: 'Missing required expense details.' }, { status: 400 });
    }

    // Ensure amount is a number
    const amount = parseFloat(expenseDetails.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    }



    // Create the accounting entry with the validated data
    await createExpenseEntry({
      ...expenseDetails,
      amount,
      organizationId,
      _id: new mongoose.Types.ObjectId() // Generate a new ID for this expense
    });

    return NextResponse.json({ message: "Expense recorded and accounting entry created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating expense entry:", error);
    return NextResponse.json({ message: "Failed to create expense entry", error: error.message }, { status: 500 });
  }
}
