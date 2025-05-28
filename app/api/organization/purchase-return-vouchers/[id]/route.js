import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, context) {
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
    // Fetch the purchase return voucher by ID and populate supplier and items.item
    const purchaseReturn = await PurchaseReturnVoucher.findOne({
      _id: id,
      organization: organizationId
    }).populate('supplier').populate('items.item');
    if (!purchaseReturn) {
      return NextResponse.json({ message: 'Purchase return voucher not found' }, { status: 404 });
    }
    return NextResponse.json({ purchaseReturn }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

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
    const deleted = await PurchaseReturnVoucher.findOneAndDelete({
      _id: id,
      organization: organizationId
    });
    if (!deleted) {
      return NextResponse.json({ message: 'Purchase return voucher not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Purchase return voucher deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 