import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesVoucher2, User } from '@/lib/models'; // Import User model
import Organization from '@/lib/models/Organization';
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { createSalesVoucherEntry } from '@/lib/accounting'; // Import accounting function

// DEBUG: Log schema paths at runtime
console.log('SalesVoucher2 model schema paths:', Object.keys(SalesVoucher2.schema.paths));

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
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    // Look up the organization name
    const orgDoc = await Organization.findById(organizationId).lean();
    if (!orgDoc || !orgDoc.name) {
      return NextResponse.json({ message: 'Organization not found or missing name.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;
    
    const salesOrderData = await request.json();
    
    // Remove frontend-generated salesVoucherNumber if present
    if (salesOrderData.salesVoucherNumber) {
      delete salesOrderData.salesVoucherNumber;
    }

    // Remove status from log and model
    console.log("Sales Order Data to save:", {
      ...salesOrderData,
      organization: organizationId
    });

    const newSalesOrder = new SalesVoucher2({
      ...salesOrderData,
      organization: organizationId, // Associate sales order with the user's organization
      createdAt: new Date() // Mongoose will handle timestamp if schema has timestamps: true
    });

    await newSalesOrder.save();

    // Try/catch for voucher number generation and save
    let generatedVoucherNumber = null;
    try {
      generatedVoucherNumber = await createSalesVoucherEntry(newSalesOrder, organizationId, organizationName);
      // Use plain updateOne to guarantee persistence
      console.log('Generated voucher number:', generatedVoucherNumber);
      const updateResult = await SalesVoucher2.updateOne(
        { _id: newSalesOrder._id },
        { salesVoucherNumber: generatedVoucherNumber }
      );
      console.log('Update result:', updateResult);
      const updatedVoucher = await SalesVoucher2.findById(newSalesOrder._id);
      console.log('Updated voucher after plain update:', updatedVoucher);
    } catch (err) {
      console.error("Failed to generate or save salesVoucherNumber:", err);
      // Optionally: delete the voucher if you want to enforce atomicity
      // await SalesVoucher2.deleteOne({ _id: newSalesOrder._id });
      return NextResponse.json({ message: "Failed to generate voucher number", error: err.message }, { status: 500 });
    }

    const updatedSalesOrder = await SalesVoucher2.findById(newSalesOrder._id).lean();
    console.log("New Sales Voucher saved:", updatedSalesOrder);

    return NextResponse.json({ message: "Sales Voucher created successfully", salesVoucher: updatedSalesOrder, voucherNumber: generatedVoucherNumber }, { status: 201 });
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
    const salesOrders = await SalesVoucher2.find({ organization: organizationId })
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
