import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    if (!number) {
      return NextResponse.json({ unique: false, message: 'No voucher number provided' }, { status: 400 });
    }
    // Check in Medici journals for RcV- voucher number
    const db = mongoose.connection.db;
    const journal = await db.collection('medici_journals').findOne({ voucherNumber: number });
    if (journal) {
      return NextResponse.json({ unique: false, message: 'Voucher number already exists' });
    }
    return NextResponse.json({ unique: true });
  } catch (error) {
    return NextResponse.json({ unique: false, message: error.message }, { status: 500 });
  }
} 