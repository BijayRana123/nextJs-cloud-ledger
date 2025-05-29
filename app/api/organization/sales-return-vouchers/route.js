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
    if (!salesReturnData.referenceNo) {
      try {
        salesReturnData.referenceNo = await Counter.getNextSequence('sales_return_voucher', {
          prefix: 'SR-',
          paddingSize: 4
        });
      } catch (err) {
        salesReturnData.referenceNo = `SR-${Date.now()}`;
      }
    }
    const newSalesReturn = new SalesReturnVoucher({
      ...salesReturnData,
      organization: organizationId,
      createdAt: new Date(),
      status: 'DRAFT',
    });
    await newSalesReturn.save();
    // Create journal entry for sales return
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
    return NextResponse.json({ 
      message: errorMessage,
      error: error.message
    }, { status: 500 });
  }
}

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
    const salesReturnVouchers = await SalesReturnVoucher.find({ organization: organizationId }).populate('customer').lean();
    return NextResponse.json({ salesReturnVouchers }, { status: 200 });
  } catch (error) {
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
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ message: 'ID and status are required.' }, { status: 400 });
    }
    const salesReturn = await SalesReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!salesReturn) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }
    salesReturn.status = status;
    await salesReturn.save();
    return NextResponse.json({ message: 'Sales return voucher status updated', salesReturn }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 