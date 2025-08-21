import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder } from '@/lib/models';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params

    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('supplier')
      .populate('items.item');

    if (purchaseOrder) {
      return NextResponse.json({ purchaseOrder }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Purchase Order not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params
    const updateData = await request.json();

    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, { new: true });

    if (updatedPurchaseOrder) {
      return NextResponse.json({ message: "Purchase Order updated successfully", purchaseOrder: updatedPurchaseOrder }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Purchase Order not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ message: "Failed to update purchase order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params

    // Find the order first so we can clean up linked accounting data
    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return NextResponse.json({ message: "Purchase Order not found" }, { status: 404 });
    }

    // Best-effort cleanup of accounting artifacts
    try {
      const db = (await import('mongoose')).default.connection.db;
      const txCol = db.collection('medici_transactions');
      const jrCol = db.collection('medici_journals');

      // 1) Remove medici transactions that reference this voucher
      await txCol.deleteMany({
        $or: [
          { 'meta.purchaseVoucherId': po._id },
          { 'meta.purchaseOrderId': po._id },
        ]
      });

      // Also remove transactions and journals tied to this voucherNumber (legacy/edge cases)
      if (po.referenceNo) {
        const jrCursor = await jrCol.find({
          voucherNumber: po.referenceNo,
          organizationId: po.organization
        }, { projection: { _id: 1 } });
        const jrDocs = await jrCursor.toArray();
        const jrIds = jrDocs.map(j => j._id);
        if (jrIds.length) {
          await txCol.deleteMany({ _journal: { $in: jrIds } });
          await jrCol.deleteMany({ _id: { $in: jrIds } });
        }
      }

      // 2) Optionally remove orphan journals that have no transactions and same org
      await jrCol.deleteMany({
        organizationId: po.organization,
        _transactions: { $size: 0 }
      });

      // 3) Remove stock entries created for this voucher
      const { default: StockEntry } = await import('@/lib/models/StockEntry');
      await StockEntry.deleteMany({ referenceId: po._id, referenceType: 'PurchaseVoucher', organization: po.organization });

      // 4) Optionally rollback Item.quantity increments
      try {
        const { default: Item } = await import('@/lib/models/Item');
        if (po.items && po.items.length) {
          for (const it of po.items) {
            if (it.item && it.quantity) {
              await Item.updateOne({ _id: it.item }, { $inc: { quantity: -Number(it.quantity) } });
            }
          }
        }
      } catch {}
    } catch (cleanupErr) {
      console.error('Cleanup error while deleting purchase order:', cleanupErr);
      // Continue; deletion of PO should not be blocked
    }

    // Finally remove the purchase order
    await PurchaseOrder.findByIdAndDelete(id);

    return NextResponse.json({ message: "Purchase Order deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json({ message: "Failed to delete purchase order" }, { status: 500 });
  }
}
