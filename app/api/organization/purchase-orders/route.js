import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder, User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { createPurchaseEntry } from '@/lib/accounting'; // Import accounting function

export async function POST(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }


    const purchaseOrderData = await request.json();
    
    // Ensure purchaseOrderNumber is set
    if (!purchaseOrderData.purchaseOrderNumber) {
      purchaseOrderData.purchaseOrderNumber = `PO-${Date.now()}`;
    }

    // Log the data being sent to the database
    console.log("Purchase Order Data to save:", {
      ...purchaseOrderData,
      organization: organizationId,
      status: 'DRAFT'
    });

    const newPurchaseOrder = new PurchaseOrder({
      ...purchaseOrderData,
      organization: organizationId, // Associate purchase order with the user's organization
      createdAt: new Date(), // Mongoose will handle timestamp if schema has timestamps: true
      status: 'DRAFT', // Initial status
    });

    await newPurchaseOrder.save();

    // Create accounting entry for the purchase order
    await createPurchaseEntry(newPurchaseOrder);

    console.log("New Purchase Order saved:", newPurchaseOrder);

    return NextResponse.json({ message: "Purchase Order created successfully", purchaseOrder: newPurchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create purchase order";
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      });
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    // Fetch purchase orders for the authenticated user's organization and populate the supplier details
    const purchaseOrders = await PurchaseOrder.find({ organization: organizationId }).populate('supplier');

    return NextResponse.json({ purchaseOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
