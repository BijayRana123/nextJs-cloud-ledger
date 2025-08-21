import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder, User, Organization } from '@/lib/models'; // Import Organization model
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

    // Fetch organization name using organizationId
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;


    const purchaseOrderData = await request.json();
    
    // Remove frontend-generated referenceNo if present - let accounting function generate proper number
    if (purchaseOrderData.referenceNo) {
      delete purchaseOrderData.referenceNo;
    }

    // Ensure purchaseOrderNumber is set (this is separate from referenceNo)
    if (!purchaseOrderData.purchaseOrderNumber) {
      purchaseOrderData.purchaseOrderNumber = `PO-${Date.now()}`;
    }



    // Save dueDate and supplierBillNo if provided, always set them
    const newPurchaseOrder = new PurchaseOrder({
      ...purchaseOrderData,
      organization: organizationId,
      dueDate: purchaseOrderData.dueDate || null,
      supplierBillNo: purchaseOrderData.supplierBillNo || '',
      createdAt: new Date(),
    });

    await newPurchaseOrder.save();

    // Try/catch for voucher number generation and save
    let generatedVoucherNumber = null;
    try {
      generatedVoucherNumber = await createPurchaseEntry(newPurchaseOrder, organizationId, organizationName);
      
      // Update the PurchaseOrder with the generated voucher number
      await PurchaseOrder.updateOne(
        { _id: newPurchaseOrder._id },
        { referenceNo: generatedVoucherNumber }
      );
    } catch (err) {
      console.error('Error in createPurchaseEntry:', err);
      console.error('Error stack:', err.stack);
      // Optionally: delete the purchase order if you want to enforce atomicity
      // await PurchaseOrder.deleteOne({ _id: newPurchaseOrder._id });
      return NextResponse.json({ 
        message: "Failed to generate voucher number", 
        error: err.message, 
        stack: err.stack 
      }, { status: 500 });
    }

    // Fetch the updated purchase order
    const updatedPurchaseOrder = await PurchaseOrder.findById(newPurchaseOrder._id).populate('supplier');



    return NextResponse.json({ 
      message: "Purchase Voucher created successfully", 
      purchaseOrder: updatedPurchaseOrder,
      voucherNumber: generatedVoucherNumber 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create purchase voucher";
    
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
