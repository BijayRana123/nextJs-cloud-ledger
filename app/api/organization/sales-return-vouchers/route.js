import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesReturnVoucher, User, Item } from '@/lib/models'; // Import User and new SalesReturnVoucher model
import { protect } from '@/lib/middleware/auth';
import { createSalesReturnEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';
import Organization from '@/lib/models/Organization';

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
    // Fetch organization name from DB for consistency
    const orgDoc = await Organization.findById(organizationId).lean();
    if (!orgDoc || !orgDoc.name) {
      return NextResponse.json({ message: 'Organization not found or missing name.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;
    const salesReturnData = await request.json();
    console.log(salesReturnData);
    // Handle cash sales return: if customer is 'CASH' or empty, remove the customer field
    if (salesReturnData.customer === 'CASH' || !salesReturnData.customer) {
      delete salesReturnData.customer;
    }
    // Remove manual referenceNo generation. Let createSalesReturnEntry handle it.
    const newSalesReturn = new SalesReturnVoucher({
      ...salesReturnData,
      organization: organizationId,
      createdAt: new Date()
    });
    await newSalesReturn.save();
    // Generate and assign the correct voucher number
    let generatedVoucherNumber = null;
    try {
      generatedVoucherNumber = await createSalesReturnEntry(newSalesReturn, organizationId, organizationName);
      const updateResult = await SalesReturnVoucher.updateOne(
        { _id: newSalesReturn._id },
        { referenceNo: generatedVoucherNumber }
      );
      const updatedSalesReturn = await SalesReturnVoucher.findById(newSalesReturn._id).lean();
      return NextResponse.json({ message: "Sales Return Voucher created successfully", salesReturnVoucher: updatedSalesReturn, voucherNumber: generatedVoucherNumber }, { status: 201 });
    } catch (err) {
      return NextResponse.json({ message: "Failed to generate voucher number", error: err.message }, { status: 500 });
    }
  } catch (error) {
    let errorMessage = "Failed to create sales return voucher";
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      });
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    }
    console.error("Error creating sales return voucher:", error);
    return NextResponse.json({
      message: errorMessage,
      error: error.message
    }, { status: 500 });
  }
}

// Remove placeholder data and use database fetching
// const dummySalesReturnVouchers = [...];

export async function GET(request) {
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
    // Fetch sales return vouchers for the organization, populate customer and sort
    const salesReturnVouchers = await SalesReturnVoucher.find({ organization: organizationId })
      .populate('customer')
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .lean();

    return NextResponse.json({ salesReturnVouchers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales return vouchers:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
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
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'ID is required.' }, { status: 400 });
    }
    const salesReturn = await SalesReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!salesReturn) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }
    await salesReturn.save();
    return NextResponse.json({ message: 'Sales return voucher updated', salesReturn: salesReturn }, { status: 200 });
  } catch (error) {
    console.error("Error updating sales return voucher:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

