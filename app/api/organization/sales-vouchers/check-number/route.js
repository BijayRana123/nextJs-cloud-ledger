import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
// import SalesVoucher from '@/lib/models/SalesVoucher';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const number = searchParams.get('number');
  if (!number) {
    return NextResponse.json({ unique: false, error: 'Missing number parameter' }, { status: 400 });
  }
  try {
    const exists = await SalesVoucher.findOne({ salesVoucherNumber: number });
    return NextResponse.json({ unique: !exists });
  } catch (error) {
    return NextResponse.json({ unique: false, error: error.message }, { status: 500 });
  }
} 