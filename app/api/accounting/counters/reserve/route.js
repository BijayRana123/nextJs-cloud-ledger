import { NextResponse } from 'next/server';
import Counter from '@/lib/models/Counter';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (!type) {
      return NextResponse.json({ error: 'Counter type is required' }, { status: 400 });
    }
    let counterConfig = {
      name: '',
      prefix: '',
      paddingSize: 4
    };
    switch (type) {
      case 'receipt':
        counterConfig.name = 'receipt_voucher';
        counterConfig.prefix = 'RcV-';
        break;
      case 'bill':
        counterConfig.name = 'payment_voucher';
        counterConfig.prefix = 'PaV-';
        break;
      // Add other types as needed
      default:
        return NextResponse.json({ error: 'Invalid counter type' }, { status: 400 });
    }
    // Actually increment and reserve the next number
    const reservedNumber = await Counter.getNextSequence(counterConfig.name, {
      prefix: counterConfig.prefix,
      paddingSize: counterConfig.paddingSize
    });
    return NextResponse.json({ reservedNumber, counterType: type });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reserve counter value', details: error.message }, { status: 500 });
  }
} 