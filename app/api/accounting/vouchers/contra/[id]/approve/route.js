import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ContraVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createContraEntry } from '@/lib/accounting';

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
    const contraVoucher = await ContraVoucher.findOne({ _id: id, organization: organizationId });
    if (!contraVoucher) {
      return NextResponse.json({ message: 'Contra voucher not found' }, { status: 404 });
    }
    if (contraVoucher.status !== 'DRAFT') {
      return NextResponse.json({ message: 'Only DRAFT vouchers can be approved' }, { status: 400 });
    }
    contraVoucher.status = 'APPROVED';
    await contraVoucher.save();
    await createContraEntry(contraVoucher);
    return NextResponse.json({ message: 'Contra voucher approved', contraVoucher }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to approve contra voucher', error: error.message }, { status: 500 });
  }
} 