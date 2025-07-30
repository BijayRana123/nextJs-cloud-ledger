import { NextResponse } from 'next/server';
import Counter from '@/lib/models/Counter';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  await dbConnect();
  // List all counters for debugging
  const counters = await Counter.find({}).lean();
  return NextResponse.json({ counters });
}

export async function POST(request) {
  return await fixCounter();
}

async function fixCounter() {
  try {
    await dbConnect();

    // Delete existing payment voucher counter
    await Counter.deleteOne({ name: 'payment_voucher' });

    // Create new payment voucher counter with correct configuration
    const newCounter = new Counter({
      name: 'payment_voucher',
      prefix: 'PaV-',
      paddingSize: 4,
      seq: 0,
      organization: ''
    });

    await newCounter.save();

    // Verify the counter was created correctly
    const counter = await Counter.findOne({ name: 'payment_voucher' });
    if (!counter) {
      throw new Error('Failed to create counter');
    }

    return NextResponse.json({
      success: true,
      message: 'Payment voucher counter has been reset with correct configuration',
      counter
    });
  } catch (error) {
    console.error('Error fixing payment voucher counter:', error);
    return NextResponse.json(
      { error: 'Failed to fix payment voucher counter' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await dbConnect();
  try {
    // Delete all receipt_voucher counters (case-insensitive)
    const result = await Counter.deleteMany({ name: { $regex: /^receipt_voucher$/i } });
    if (result.deletedCount > 0) {
      return NextResponse.json({ message: 'All receipt_voucher counters deleted successfully.' });
    } else {
      return NextResponse.json({ message: 'No receipt_voucher counter found.' });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting receipt_voucher counter.', error: error.message }, { status: 500 });
  }
} 
