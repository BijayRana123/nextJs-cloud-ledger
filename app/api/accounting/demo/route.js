import { NextResponse } from 'next/server';
import { runAccountingDemo } from '../../../../lib/examples/accountingExamples';

// POST - Run the accounting demo
export async function POST() {
  try {
    const result = await runAccountingDemo();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running accounting demo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 