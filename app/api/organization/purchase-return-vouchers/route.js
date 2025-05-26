import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createPurchaseReturnEntry } from '@/lib/accounting';

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
    const purchaseReturnData = await request.json();
    if (!purchaseReturnData.referenceNo) {
      purchaseReturnData.referenceNo = `PR-${Date.now()}`;
    }
    const newPurchaseReturn = new PurchaseReturnVoucher({
      ...purchaseReturnData,
      organization: organizationId,
      createdAt: new Date(),
      status: 'DRAFT',
    });
    await newPurchaseReturn.save();
    // Create journal entry for purchase return
    await createPurchaseReturnEntry(newPurchaseReturn);
    return NextResponse.json({ message: 'Purchase Return Voucher created successfully', purchaseReturnVoucher: newPurchaseReturn }, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create purchase return voucher';
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      });
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    }
    return NextResponse.json({ message: errorMessage, error: error.message }, { status: 500 });
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
    const purchaseReturnVouchers = await PurchaseReturnVoucher.find({ organization: organizationId }).populate('supplier');
    return NextResponse.json({ purchaseReturnVouchers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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
    const purchaseReturn = await PurchaseReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!purchaseReturn) {
      return NextResponse.json({ message: 'Purchase return voucher not found' }, { status: 404 });
    }
    purchaseReturn.status = status;
    await purchaseReturn.save();
    return NextResponse.json({ message: 'Purchase return voucher status updated', purchaseReturn }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 