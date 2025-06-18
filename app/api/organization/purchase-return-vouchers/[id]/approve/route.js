import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createPurchaseReturnEntry } from '@/lib/accounting';

export async function POST(request, context) {
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
    const params = await context.params;
    const id = params.id;
    // Find the purchase return voucher by ID and organization ID
    const purchaseReturn = await PurchaseReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!purchaseReturn) {
      return NextResponse.json({ message: 'Purchase return voucher not found' }, { status: 404 });
    }
    // Check if the purchase return voucher can be approved (only if it's in DRAFT status)
    if (purchaseReturn.status !== 'DRAFT') {
      return NextResponse.json({ message: 'Only draft purchase return vouchers can be approved' }, { status: 400 });
    }
    // Update the status to APPROVED
    purchaseReturn.status = 'APPROVED';
    await purchaseReturn.save();
    // Optionally, create a journal voucher (if not already done)
    // if (purchaseReturnVoucher.status === 'approved' && !purchaseReturnVoucher.journalEntryCreated) {
    //   await createPurchaseReturnEntry(purchaseReturnVoucher);
    //   purchaseReturnVoucher.journalEntryCreated = true;
    //   await purchaseReturnVoucher.save();
    // }
    return NextResponse.json({ message: 'Purchase return voucher approved successfully', purchaseReturn }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 