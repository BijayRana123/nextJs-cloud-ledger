import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { Item, StockEntry } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
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

    // Get all inventory items (goods)
    const items = await Item.find({ 
      organization: organizationId,
      type: 'Goods'
    }).lean();

    // Calculate current stock for each item
    const itemsWithStock = await Promise.all(items.map(async (item) => {
      // Get all stock entries for this item
      const stockEntries = await StockEntry.find({
        item: item._id,
        organization: organizationId
      }).lean();

      // Calculate current stock (avoid double counting opening stock entries)
      const totalMovements = stockEntries.reduce((sum, entry) => {
        // Skip opening stock entries to avoid double counting
        if (entry.transactionType === 'opening') {
          return sum;
        }
        return sum + entry.quantity;
      }, 0);
      const currentStock = (item.openingStock || 0) + totalMovements;

      return {
        ...item,
        currentStock,
        stockEntries: stockEntries.length
      };
    }));

    // Calculate summary statistics
    const summary = {
      totalItems: itemsWithStock.length,
      inStock: itemsWithStock.filter(item => item.currentStock > 10).length,
      lowStock: itemsWithStock.filter(item => item.currentStock > 0 && item.currentStock <= 10).length,
      outOfStock: itemsWithStock.filter(item => item.currentStock <= 0).length,
      totalStockValue: itemsWithStock.reduce((sum, item) => {
        const value = (item.defaultRate || 0) * item.currentStock;
        return sum + value;
      }, 0)
    };

    return NextResponse.json({
      success: true,
      items: itemsWithStock,
      summary
    });

  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
