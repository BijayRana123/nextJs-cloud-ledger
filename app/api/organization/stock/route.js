import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item, StockEntry, Warehouse } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    // Get the organization ID from the request object
    const organizationId = request.organizationId;

    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    // Get all items for this organization
    const items = await Item.find({ organization: organizationId, type: 'Goods' })
      .select('_id name code openingStock')
      .lean();

    // Calculate current stock for each item
    const stockData = await Promise.all(items.map(async (item) => {
      // Sum all stock entries for this item
      const stockEntries = await StockEntry.find({ 
        item: item._id, 
        organization: organizationId 
      });
      
      const currentStock = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      
      return {
        ...item,
        currentStock,
        stockEntries: stockEntries.length
      };
    }));

    return NextResponse.json({ stockData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}