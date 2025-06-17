import { NextResponse } from 'next/server';
import Counter from '@/lib/models/Counter';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get counter type from query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Counter type is required' },
        { status: 400 }
      );
    }

    // Map the requested type to counter configurations
    let counterConfig = {
      name: '',
      prefix: '',
      paddingSize: 4
    };

    switch (type) {
      case 'invoice':
        counterConfig.name = 'receipt_voucher';
        counterConfig.prefix = 'INV-';
        break;
      case 'bill':
        counterConfig.name = 'payment_voucher';
        counterConfig.prefix = 'PaV-';
        break;
      case 'receipt':
        counterConfig.name = 'receipt_voucher';
        counterConfig.prefix = 'RcV-';
        break;
      case 'journal':
        counterConfig.name = 'journal_entry';
        counterConfig.prefix = 'JV-';
        break;

      case 'sales':
        counterConfig.name = 'sales_order';
        counterConfig.prefix = 'SV-';
        break;
      case 'purchase':
        counterConfig.name = 'purchase_order';
        counterConfig.prefix = 'PV-';
        break;
      case 'salesreturn':
        counterConfig.name = 'sales_return_voucher';
        counterConfig.prefix = 'SRV-';
        break;
      case 'purchasereturn':
        counterConfig.name = 'purchase_return_voucher';
        counterConfig.prefix = 'PRV-';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid counter type' },
          { status: 400 }
        );
    }

    // Peek at the next number without incrementing it
    const counter = await Counter.findOne({ name: counterConfig.name });
    
    let nextValue = 1; // Default starting value
    if (counter) {
      nextValue = counter.value + 1;
    }

    // Format the number with padding
    const paddedNumber = nextValue.toString().padStart(counterConfig.paddingSize, '0');
    const nextNumber = `${counterConfig.prefix}${paddedNumber}`;

    return NextResponse.json({
      nextNumber,
      counterType: type
    });
  } catch (error) {
    console.error('Error getting next counter value:', error);
    return NextResponse.json(
      { error: 'Failed to get next counter value' },
      { status: 500 }
    );
  }
}