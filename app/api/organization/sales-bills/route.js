import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesBill, User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware

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

    const salesBillData = await request.json();
    
    // Ensure referenceNo is set
    if (!salesBillData.referenceNo) {
      salesBillData.referenceNo = `SB-${Date.now()}`;
    }

    // Log the data being sent to the database
    console.log("Sales Bill Data to save:", {
      ...salesBillData,
      organization: organizationId,
      status: 'DRAFT'
    });

    const newSalesBill = new SalesBill({
      ...salesBillData,
      organization: organizationId, // Associate sales bill with the user's organization
      createdAt: new Date(), // Mongoose will handle timestamp if schema has timestamps: true
      status: 'DRAFT', // Initial status
    });

    await newSalesBill.save();

    console.log("New Sales Bill saved:", newSalesBill);

    return NextResponse.json({ message: "Sales Bill created successfully", salesBill: newSalesBill }, { status: 201 });
  } catch (error) {
    console.error("Error creating sales bill:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create sales bill";
    
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

    // Fetch sales bills for the authenticated user's organization and populate the customer details
    const salesBills = await SalesBill.find({ organization: organizationId }).populate({ path: 'customer', select: '_id name' }).lean();

    return NextResponse.json({ salesBills }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales bills:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}