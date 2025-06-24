import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesReturnVoucher, User } from '@/lib/models'; // Import User and new SalesReturnVoucher model
import { protect } from '@/lib/middleware/auth';
import { createSalesReturnEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';

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
    const salesReturnData = await request.json();
    // Validate customer field
    if (!salesReturnData.customer || typeof salesReturnData.customer !== 'string' || salesReturnData.customer.trim() === '') {
      return NextResponse.json({ message: 'Customer is required and must be a valid customer ID.' }, { status: 400 });
    }
    if (!salesReturnData.referenceNo) {
      try {
        salesReturnData.referenceNo = await Counter.getNextSequence('sales_return_voucher', {
          prefix: 'SRV-',
          paddingSize: 4
        });
      } catch (err) {
        salesReturnData.referenceNo = `SRV-${Date.now()}`;
      }
    }
    const newSalesReturn = new SalesReturnVoucher({
      ...salesReturnData,
      organization: organizationId,
      createdAt: new Date()
    });
    await newSalesReturn.save();
    // Create journal voucher for sales return
    await createSalesReturnEntry(newSalesReturn);
    return NextResponse.json({ message: "Sales Return Voucher created successfully", salesReturnVoucher: newSalesReturn }, { status: 201 });
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

// Add DELETE handler similar to Sales Orders if needed
/*
export async function DELETE(request, context) {
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
    const params = context.params;
    const id = params.id;
    const deleted = await SalesReturnVoucher.findOneAndDelete({
      _id: id,
      organization: organizationId
    });
    if (!deleted) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Sales return voucher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sales return voucher:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
*/