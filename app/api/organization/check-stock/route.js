import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ message: 'Items array is required' }, { status: 400 });
    }

    const stockErrors = [];
    const stockWarnings = [];
    
    console.log('Checking stock for', items.length, 'items');
    
    for (const checkItem of items) {
      if (checkItem.item) {
        // Find the inventory item
        const inventoryItem = await Item.findOne({
          _id: checkItem.item,
          organization: organizationId
        });
        
        if (inventoryItem) {
          const currentStock = inventoryItem.quantity || 0;
          const requestedQty = checkItem.quantity || 0;
          const lowStockThreshold = inventoryItem.lowStockThreshold || 10;
          
          console.log(`Item: ${inventoryItem.name}, Stock: ${currentStock}, Requested: ${requestedQty}, Threshold: ${lowStockThreshold}`);
          
          // Check if there's insufficient stock
          if (currentStock < requestedQty) {
            stockErrors.push({
              itemName: inventoryItem.name,
              currentStock,
              requestedQty,
              shortage: requestedQty - currentStock
            });
          }
          // Check if stock will be low after operation
          else if ((currentStock - requestedQty) <= lowStockThreshold) {
            stockWarnings.push({
              itemName: inventoryItem.name,
              currentStock,
              requestedQty,
              remainingAfterSale: currentStock - requestedQty,
              lowStockThreshold
            });
          }
        } else {
          stockErrors.push({
            itemName: 'Unknown Item',
            error: 'Item not found in inventory'
          });
        }
      }
    }

    return NextResponse.json({
      errors: stockErrors,
      warnings: stockWarnings,
      canProceed: stockErrors.length === 0
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking stock:', error);
    return NextResponse.json({ 
      message: "Failed to check stock levels",
      error: error.message 
    }, { status: 500 });
  }
}