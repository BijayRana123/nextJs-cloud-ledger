import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder } from '@/lib/models';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params

    const purchaseOrder = await PurchaseOrder.findById(id);

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

    const deletedPurchaseOrder = await PurchaseOrder.findByIdAndDelete(id);

    if (deletedPurchaseOrder) {
      return NextResponse.json({ message: "Purchase Order deleted successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Purchase Order not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json({ message: "Failed to delete purchase order" }, { status: 500 });
  }
}
