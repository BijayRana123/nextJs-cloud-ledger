import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import {PurchaseOrder }from '@/lib/models'; // Assuming PurchaseOrder model is in lib/models.js
import { protect } from '@/lib/middleware/auth'; // Assuming auth middleware exists

export async function POST(request, { params }) {
  await dbConnect();

  // Apply authentication middleware
  const authResult = await protect(request);
  if (authResult !== null) { // Check if protect returned an error response
    return authResult; // Return unauthorized response
  }

  const id = (await params).id;

  try {
    const purchaseOrder = await PurchaseOrder.findById(id);

    if (!purchaseOrder) {
      return NextResponse.json({ message: 'Purchase Order not found' }, { status: 404 });
    }

    // Implement approval logic here
    // For example, update a status field
    // Correcting status to match the schema enum (uppercase)
    purchaseOrder.status = 'APPROVED';
    await purchaseOrder.save();

    return NextResponse.json({ message: 'Purchase Order approved successfully', purchaseOrder });
  } catch (error) {
    console.error('Error approving purchase order:', error);
    // Include the error message in the response for better debugging
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

// You might also want to handle other HTTP methods like PUT if needed
// export async function PUT(request, { params }) { ... }
