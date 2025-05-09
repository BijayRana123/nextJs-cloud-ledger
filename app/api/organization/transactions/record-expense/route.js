import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createExpenseEntry } from '@/lib/accounting';

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

    const expenseDetails = await request.json();

    // Validate incoming data as needed
    if (!expenseDetails.expenseType || !expenseDetails.amount || !expenseDetails.description || !expenseDetails.paymentMethod) {
        return NextResponse.json({ message: 'Missing required expense details.' }, { status: 400 });
    }

    // Create the accounting entry
    await createExpenseEntry(expenseDetails);

    return NextResponse.json({ message: "Expense recorded and accounting entry created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating expense entry:", error);
    return NextResponse.json({ message: "Failed to create expense entry", error: error.message }, { status: 500 });
  }
}
