import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import mongoose from 'mongoose'; // Import mongoose to access models

export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // User is authenticated, get the user ID from the modified request object
    const userId = request.user._id;

    // Find the user to get their organization ID
    const user = await User.findById(userId).populate('organizations');
    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ message: 'User or organization not found' }, { status: 404 });
    }

    // Assuming the user is associated with one organization for purchase bills
    const organizationId = user.organizations[0]._id;

    // Explicitly get the PurchaseBill model after connecting to the DB
    const PurchaseBill = mongoose.connection.models.PurchaseBill;

    if (!PurchaseBill) {
      console.error("PurchaseBill model not found in mongoose connection models.");
      return NextResponse.json({ message: "Internal Server Error: PurchaseBill model not registered." }, { status: 500 });
    }

    // Fetch purchase bills for the authenticated user's organization
    const purchaseBills = await PurchaseBill.find({ organization: organizationId });

    return NextResponse.json({ purchaseBills }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase bills:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// You might also need a POST handler for creating purchase bills,
// but for this task, we only focus on fetching.
// export async function POST(request) { ... }
