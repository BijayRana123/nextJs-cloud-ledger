import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { PurchaseOrder, User } from '@/lib/models'; // Import User model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware

export async function POST(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // User is authenticated, get the user ID from the modified request object
    const userId = request.user._id;

    // Find the user to get their organization ID
    const user = await User.findById(userId).populate('organizations');
    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ message: 'User or organization not found' }, { status: 404 });
    }

    // Assuming the user is associated with one organization for purchase orders
    // You might need to adjust this logic if a user can manage multiple organizations
    const organizationId = user.organizations[0]._id;


    const purchaseOrderData = await request.json();

    const newPurchaseOrder = new PurchaseOrder({
      ...purchaseOrderData,
      organization: organizationId, // Associate purchase order with the user's organization
      createdAt: new Date(), // Mongoose will handle timestamp if schema has timestamps: true
      status: 'DRAFT', // Initial status
    });

    await newPurchaseOrder.save();

    console.log("New Purchase Order saved:", newPurchaseOrder);

    return NextResponse.json({ message: "Purchase Order created successfully", purchaseOrder: newPurchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ message: "Failed to create purchase order" }, { status: 500 });
  }
}

export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);

    if (authResult && authResult.status !== 200) {
      // If authentication fails, return the error response from the middleware
      return authResult;
    }

    // User is authenticated, get the user ID from the modified request object
    const userId = request.user._id;

    // Find the user to get their organization ID
    const user = await User.findById(userId).populate('organizations');
    if (!user || user.organizations.length === 0) {
      return NextResponse.json({ message: 'User or organization not found' }, { status: 404 });
    }

    // Assuming the user is associated with one organization for purchase orders
    const organizationId = user.organizations[0]._id;

    // Fetch purchase orders for the authenticated user's organization
    const purchaseOrders = await PurchaseOrder.find({ organization: organizationId });

    return NextResponse.json({ purchaseOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
