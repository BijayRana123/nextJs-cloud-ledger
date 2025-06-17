import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PaymentVoucher from '@/lib/models/PaymentVoucher';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');
  if (!number) {
    return NextResponse.json({ unique: false, error: 'No number provided' }, { status: 400 });
  }
  const exists = await PaymentVoucher.exists({ paymentVoucherNumber: number });
  return NextResponse.json({ unique: !exists });
} 