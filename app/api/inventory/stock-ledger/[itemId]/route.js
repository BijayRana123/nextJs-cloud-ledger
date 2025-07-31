import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { Item, StockEntry, SalesVoucher2, PurchaseOrder, SalesReturnVoucher, PurchaseReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
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

    const { itemId } = await params;
    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
    }

    // Get the item details
    const item = await Item.findOne({ 
      _id: itemId, 
      organization: organizationId 
    }).lean();
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get URL parameters for date filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query for stock entries
    let stockQuery = { 
      item: itemId, 
      organization: organizationId 
    };
    
    if (startDate) stockQuery.date = { $gte: new Date(startDate) };
    if (endDate) stockQuery.date = { ...stockQuery.date, $lte: new Date(endDate) };

    // Get all stock entries for this item
    const stockEntries = await StockEntry.find(stockQuery)
      .populate('warehouse', 'name')
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // Calculate opening stock (entries before start date)
    // Don't double-count opening stock - either use item.openingStock OR opening stock entries, not both
    let openingStock = 0;
    
    if (startDate) {
      // If filtering by date, calculate opening stock from all entries before start date
      const openingEntries = await StockEntry.find({
        item: itemId,
        organization: organizationId,
        date: { $lt: new Date(startDate) }
      }).lean();
      
      // Include the item's opening stock plus any movements before the start date
      openingStock = (item.openingStock || 0) + openingEntries.reduce((sum, entry) => {
        // Don't double-count opening stock entries
        if (entry.transactionType === 'opening') {
          return sum; // Skip opening stock entries to avoid double counting
        }
        return sum + entry.quantity;
      }, 0);
    } else {
      // If no date filter, start with item's opening stock
      openingStock = item.openingStock || 0;
    }

    // Process stock entries to create movement records
    let currentStock = openingStock;
    let totalIn = 0;
    let totalOut = 0;
    
    const filteredEntries = stockEntries.filter(entry => {
      // Skip opening stock entries to avoid double counting
      return entry.transactionType !== 'opening';
    });
    
    const movements = await Promise.all(filteredEntries.map(async (entry) => {
      const quantityIn = entry.quantity > 0 ? entry.quantity : 0;
      const quantityOut = entry.quantity < 0 ? Math.abs(entry.quantity) : 0;
      
      totalIn += quantityIn;
      totalOut += quantityOut;
      currentStock += entry.quantity;
      
      // Determine transaction details based on transactionType
      let transactionType = 'Stock Adjustment';
      let description = 'Stock adjustment';
      let reference = 'Manual Entry';
      
      switch (entry.transactionType) {
        case 'opening':
          transactionType = 'Opening Stock';
          description = 'Opening stock entry';
          reference = 'Opening Stock';
          break;
        case 'sales':
          transactionType = 'Sales';
          description = 'Stock sold to customer';
          reference = 'Sales Voucher';
          
          // Fetch actual sales voucher to get the real voucher number
          if (entry.referenceId) {
            try {
              const salesVoucher = await SalesVoucher2.findById(entry.referenceId).lean();
              if (salesVoucher && salesVoucher.salesVoucherNumber) {
                reference = salesVoucher.salesVoucherNumber;
                description = `Stock sold to customer (${reference})`;
              }
            } catch (err) {
              console.error('Error fetching sales voucher:', err);
            }
          }
          break;
        case 'purchase':
          transactionType = 'Purchase';
          description = 'Stock purchased from supplier';
          reference = 'Purchase Voucher';
          
          // Fetch actual purchase order to get the real voucher number and supplier name
          if (entry.referenceId) {
            try {
              const purchaseOrder = await PurchaseOrder.findById(entry.referenceId)
                .populate('supplier', 'name')
                .lean();
              if (purchaseOrder) {
                // Use referenceNo (PV-) instead of purchaseOrderNumber (PO-)
                reference = purchaseOrder.referenceNo || purchaseOrder.purchaseOrderNumber || 'Purchase Voucher';
                const supplierName = purchaseOrder.supplier?.name || 'Unknown Supplier';
                description = `Stock purchased from ${supplierName}`;
              }
            } catch (err) {
              console.error('Error fetching purchase order:', err);
            }
          }
          break;
        case 'sales_return':
          transactionType = 'Sales Return';
          description = 'Stock returned by customer';
          reference = 'Sales Return';
          
          // Fetch actual sales return voucher to get the real voucher number
          if (entry.referenceId) {
            try {
              const salesReturn = await SalesReturnVoucher.findById(entry.referenceId).lean();
              if (salesReturn && salesReturn.referenceNo) {
                reference = salesReturn.referenceNo;
                description = `Stock returned by customer (${reference})`;
              }
            } catch (err) {
              console.error('Error fetching sales return voucher:', err);
            }
          }
          break;
        case 'purchase_return':
          transactionType = 'Purchase Return';
          description = 'Stock returned to supplier';
          reference = 'Purchase Return';
          
          // Fetch actual purchase return voucher to get the real voucher number
          if (entry.referenceId) {
            try {
              const purchaseReturn = await PurchaseReturnVoucher.findById(entry.referenceId)
                .populate('supplier', 'name')
                .lean();
              if (purchaseReturn) {
                reference = purchaseReturn.referenceNo || 'Purchase Return';
                const supplierName = purchaseReturn.supplier?.name || 'Unknown Supplier';
                description = `Stock returned to ${supplierName}`;
              }
            } catch (err) {
              console.error('Error fetching purchase return voucher:', err);
            }
          }
          break;
        case 'adjustment':
        default:
          transactionType = 'Stock Adjustment';
          description = entry.notes || 'Stock adjustment';
          reference = 'Adjustment';
          break;
      }
      
      return {
        _id: entry._id,
        date: entry.date,
        transactionType,
        reference,
        description,
        quantityIn,
        quantityOut,
        balance: currentStock,
        warehouse: entry.warehouse?.name || 'Main Warehouse',
        notes: entry.notes,
        referenceId: entry.referenceId
      };
    }));

    // Calculate summary
    const summary = {
      openingStock,
      totalIn,
      totalOut,
      currentStock
    };

    return NextResponse.json({
      success: true,
      item,
      movements,
      summary,
      period: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error fetching stock ledger:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}