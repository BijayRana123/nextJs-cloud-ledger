import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import { createOwnerInvestmentEntry } from '@/lib/accounting';

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

    const investmentDetails = await request.json();

    // Validate incoming data as needed
    if (!investmentDetails.amount || !investmentDetails.method) {
        return NextResponse.json({ message: 'Missing required investment details.' }, { status: 400 });
    }

    // Create the accounting entry
    await createOwnerInvestmentEntry(investmentDetails);

    return NextResponse.json({ message: "Owner investment recorded and accounting entry created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating owner investment entry:", error);
    return NextResponse.json({ message: "Failed to create owner investment entry", error: error.message }, { status: 500 });
  }
}
