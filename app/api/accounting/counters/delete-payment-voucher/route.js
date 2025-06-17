import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Counter from '@/lib/models/Counter';

export async function POST() {
  await dbConnect();
  try {
    const result = await Counter.deleteOne({ name: 'payment_voucher' });
    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'payment_voucher counter deleted successfully.' });
    } else {
      return NextResponse.json({ message: 'No payment_voucher counter found.' });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting payment_voucher counter.', error: error.message }, { status: 500 });
  }
} 