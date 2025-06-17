import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ContraVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createContraEntry } from '@/lib/accounting';
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
    const data = await request.json();
    if (!data.fromAccount || !data.toAccount || !data.amount || !data.date) {
      return NextResponse.json({ message: 'fromAccount, toAccount, amount, and date are required.' }, { status: 400 });
    }
    // Generate auto-incrementing referenceNo if not provided
    if (!data.referenceNo) {
      data.referenceNo = await Counter.getNextSequence('contra_voucher', {
        prefix: 'CV-',
        paddingSize: 4,
        startValue: 1
      });
    }
    const contraVoucher = new ContraVoucher({
      ...data,
      organization: organizationId,
      status: data.status || 'DRAFT',
    });
    await contraVoucher.save();
    // If status is APPROVED, create journal entry
    if (contraVoucher.status === 'APPROVED') {
      await createContraEntry(contraVoucher);
    }
    return NextResponse.json({ message: 'Contra voucher created', contraVoucher }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create contra voucher', error: error.message }, { status: 500 });
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
    const vouchers = await ContraVoucher.find({ organization: organizationId }).lean().sort({ date: -1 });
    return NextResponse.json({ contraVouchers: vouchers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch contra vouchers', error: error.message }, { status: 500 });
  }
} 