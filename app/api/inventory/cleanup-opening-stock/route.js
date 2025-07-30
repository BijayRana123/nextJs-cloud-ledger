import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { StockEntry } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
  await dbConnect();
  
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found.' }, { status: 400 });
    }

    // Find and remove duplicate opening stock entries
    const openingStockEntries = await StockEntry.find({
      organization: organizationId,
      transactionType: 'opening'
    });



    // Delete all opening stock entries since we now use item.openingStock directly
    const deleteResult = await StockEntry.deleteMany({
      organization: organizationId,
      transactionType: 'opening'
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} duplicate opening stock entries`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up opening stock:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
