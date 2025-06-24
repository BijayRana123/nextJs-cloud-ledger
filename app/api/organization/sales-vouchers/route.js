import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesVoucher, User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { createSalesVoucherEntry } from '@/lib/accounting'; // Import accounting function

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
    
    // Ensure salesVoucherNumber is set
    if (!salesOrderData.salesVoucherNumber) {
      salesOrderData.salesVoucherNumber = `SV-${Date.now()}`;
    }

    // Remove status from log and model
    console.log("Sales Order Data to save:", {
      ...salesOrderData,
      organization: organizationId
    });

    const newSalesOrder = new SalesVoucher({
      ...salesOrderData,
      organization: organizationId, // Associate sales order with the user's organization
      createdAt: new Date() // Mongoose will handle timestamp if schema has timestamps: true
    });

    await newSalesOrder.save();

    // Create accounting entry for the sales order
    await createSalesVoucherEntry(newSalesOrder);

    console.log("New Sales Voucher saved:", newSalesOrder);

    return NextResponse.json({ message: "Sales Voucher created successfully", salesVoucher: newSalesOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating sales voucher:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create sales voucher";
    
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

    // Fetch sales vouchers for the authenticated user's organization and populate the customer details
    const salesOrders = await SalesVoucher.find({ organization: organizationId })
      .populate({
        path: 'customer',
        select: 'name address pan phoneNumber email',
      })
      .lean();

    return NextResponse.json({ salesVouchers: salesOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
