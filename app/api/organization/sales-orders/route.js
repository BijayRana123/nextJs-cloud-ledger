import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesOrder, User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { createSalesEntry } from '@/lib/accounting'; // Import accounting function

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
    
    const salesOrderData = await request.json();
    
    // Ensure salesOrderNumber is set
    if (!salesOrderData.salesOrderNumber) {
      salesOrderData.salesOrderNumber = `SO-${Date.now()}`;
    }

    // Log the data being sent to the database
    console.log("Sales Order Data to save:", {
      ...salesOrderData,
      organization: organizationId,
      status: 'DRAFT'
    });

    const newSalesOrder = new SalesOrder({
      ...salesOrderData,
      organization: organizationId, // Associate sales order with the user's organization
      createdAt: new Date(), // Mongoose will handle timestamp if schema has timestamps: true
      status: 'DRAFT', // Initial status
    });

    await newSalesOrder.save();

    // Create accounting entry for the sales order
    await createSalesEntry(newSalesOrder);

    console.log("New Sales Order saved:", newSalesOrder);

    return NextResponse.json({ message: "Sales Order created successfully", salesOrder: newSalesOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating sales order:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create sales order";
    
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

    // Fetch sales orders for the authenticated user's organization and populate the customer details
    const salesOrders = await SalesOrder.find({ organization: organizationId }).populate('customer').lean();

    return NextResponse.json({ salesOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
