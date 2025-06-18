import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/accounting';

// This is a redirect endpoint to fix the mixed up logic between journal entries and day books
// The frontend is looking for /api/accounting/journal-entries but the actual implementation is in /api/accounting/day-books
export async function GET(request) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const journalCollection = db.collection('accounting_journals');
    // Only fetch journal vouchers (voucherNumber starts with JV-)
    const entries = await journalCollection
      .find({ voucherNumber: { $regex: '^JV-', $options: 'i' } })
      .sort({ datetime: -1 })
      .toArray();
    return NextResponse.json({ journalEntries: entries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries', journalEntries: [] },
      { status: 500 }
    );
  }
}

// For POST requests, redirect to the day-books endpoint
export async function POST(request) {
  try {
    // Clone the request to read the body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    
    // Get the original URL and create a new URL for the day-books endpoint
    const originalUrl = new URL(request.url);
    const dayBooksUrl = new URL(originalUrl);
    
    // Change the path from journal-entries to day-books
    dayBooksUrl.pathname = dayBooksUrl.pathname.replace('/journal-entries', '/day-books');
    
    // Forward the request to the day-books endpoint
    const response = await fetch(dayBooksUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to post journal voucher to day-books: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the response from the day-books endpoint
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in journal-entries redirect API (POST) for journal voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create journal voucher (via redirect)' },
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}