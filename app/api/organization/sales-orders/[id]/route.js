import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesOrder } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, context) {
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

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    // Get the sales order ID from the URL params
    const params = await context.params;
    const id = params.id;

    // Fetch the sales order by ID and populate the customer details
    const salesOrder = await SalesOrder.findOne({ 
      _id: id, 
      organization: organizationId 
    }).populate('customer').populate('items.item');

    if (!salesOrder) {
      return NextResponse.json({ message: "Sales order not found" }, { status: 404 });
    }

    return NextResponse.json({ salesOrder }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
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

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    // Get the sales order ID from the URL params
    const params = await context.params;
    const id = params.id;

    // Find the sales order by ID and organization ID
    const salesOrder = await SalesOrder.findOne({ _id: id, organization: organizationId });

    if (!salesOrder) {
      return NextResponse.json({ message: "Sales order not found" }, { status: 404 });
    }

    // Check if the sales order can be deleted (e.g., only if it's in DRAFT status)
    if (salesOrder.status !== 'DRAFT') {
      return NextResponse.json({ message: "Only draft sales orders can be deleted" }, { status: 400 });
    }

    // Delete the sales order
    await SalesOrder.deleteOne({ _id: id, organization: organizationId });

    return NextResponse.json({ message: "Sales order deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sales order:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}