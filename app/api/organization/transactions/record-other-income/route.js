import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createOtherIncomeEntry } from '@/lib/accounting';

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

    const incomeDetails = await request.json();

    // Validate incoming data as needed
    if (!incomeDetails.incomeType || !incomeDetails.amount || !incomeDetails.description || !incomeDetails.receiptMethod) {
        return NextResponse.json({ message: 'Missing required income details.' }, { status: 400 });
    }

    // Create the accounting entry
    await createOtherIncomeEntry(incomeDetails);

    return NextResponse.json({ message: "Other income recorded and accounting entry created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating other income entry:", error);
    return NextResponse.json({ message: "Failed to create other income entry", error: error.message }, { status: 500 });
  }
}
