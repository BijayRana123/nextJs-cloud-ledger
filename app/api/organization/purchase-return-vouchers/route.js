import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseReturnVoucher, Organization } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createPurchaseReturnEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';

export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    let organizationId = request.organizationId;
    // Defensive extraction if organizationId is an object
    if (typeof organizationId === 'object' && organizationId !== null) {
      if (organizationId._id) {
        organizationId = organizationId._id;
      } else if (organizationId.currentOrganization && organizationId.currentOrganization._id) {
        organizationId = organizationId.currentOrganization._id;
      } else {
        // Try to extract from nested fields or fallback
        organizationId = organizationId.toString();
      }
    }
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    const purchaseReturnData = await request.json();
    console.error('Incoming purchaseReturnData:', purchaseReturnData);

    // Explicitly remove referenceNo from incoming data to ensure backend generates it
    delete purchaseReturnData.referenceNo;
    
    const maxRetries = 5;
    let retryCount = 0;
    let generatedReferenceNo = null;

    while (retryCount < maxRetries && generatedReferenceNo === null) {
      try {
        generatedReferenceNo = await Counter.getNextSequence('purchase_return_voucher', {
          prefix: 'PRV-',
          paddingSize: 4,
          organization: organizationId
        });
      } catch (err) {
        console.error(`Failed to get next sequence for purchase_return_voucher (Attempt ${retryCount + 1}/${maxRetries}):`, err);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retrying
        }
      }
    }

    if (generatedReferenceNo === null) {
      // If counter fails after retries, throw an error
      throw new Error('Failed to generate unique reference number after multiple retries.');
    }
    
    const newPurchaseReturn = new PurchaseReturnVoucher({
      ...purchaseReturnData,
      referenceNo: generatedReferenceNo, // Use the generated reference number
      organization: organizationId,
      createdAt: new Date()
    });
    await newPurchaseReturn.save();
    // Fetch organization name using organizationId
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;
    // Create journal voucher for purchase return
    const generatedVoucherNumber = await createPurchaseReturnEntry(newPurchaseReturn, organizationId, organizationName);
    // Update the PurchaseReturnVoucher with the generated voucher number
    await PurchaseReturnVoucher.updateOne(
      { _id: newPurchaseReturn._id },
      { referenceNo: generatedVoucherNumber }
    );
    // Fetch the updated purchase return voucher
    const updatedPurchaseReturn = await PurchaseReturnVoucher.findById(newPurchaseReturn._id).populate('supplier');
    return NextResponse.json({ message: 'Purchase Return Voucher created successfully', purchaseReturnVoucher: updatedPurchaseReturn }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /purchase-return-vouchers:', error);
    if (error.stack) console.error(error.stack);
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
    const purchaseReturnVouchers = await PurchaseReturnVoucher.find({ organization: organizationId }).populate('supplier').lean();
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
    const data = await request.json();
    const { id, billNumber } = data;
    if (!id) {
      return NextResponse.json({ message: 'ID is required.' }, { status: 400 });
    }
    const purchaseReturn = await PurchaseReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!purchaseReturn) {
      return NextResponse.json({ message: 'Purchase return voucher not found' }, { status: 404 });
    }
    if (typeof billNumber !== 'undefined') {
      purchaseReturn.billNumber = billNumber;
    }
    await purchaseReturn.save();
    return NextResponse.json({ message: 'Purchase return voucher updated', purchaseReturn }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
