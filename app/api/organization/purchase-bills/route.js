import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, PurchaseBill } from '@/lib/models'; // Import User and PurchaseBill models
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import mongoose from 'mongoose'; // Import mongoose to access models

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

    // Assuming the user is associated with one organization for purchase bills
    const organizationId = user.organizations[0]._id;

    // Explicitly get the PurchaseBill model after connecting to the DB
    const PurchaseBillModel = mongoose.connection.models.PurchaseBill;

    if (!PurchaseBillModel) {
      console.error("PurchaseBill model not found in mongoose connection models.");
      return NextResponse.json({ message: "Internal Server Error: PurchaseBill model not registered." }, { status: 500 });
    }

    // Fetch purchase bills for the authenticated user's organization
    const purchaseBills = await PurchaseBillModel.find({ organization: organizationId });

    return NextResponse.json({ purchaseBills }, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase bills:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const data = await request.json();
    // Validate required fields
    if (!data.organization || !data.supplier || !data.referenceNo || !data.date || !data.items || !data.totalAmount) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    // Create the purchase bill
    const bill = await PurchaseBill.create({
      organization: data.organization,
      supplier: data.supplier,
      purchaseOrder: data.purchaseOrder || undefined,
      referenceNo: data.referenceNo,
      supplierBillNo: data.supplierBillNo || '',
      date: data.date,
      dueDate: data.dueDate || data.date,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: data.currency || 'NPR',
      exchangeRateToNPR: data.exchangeRateToNPR || 1,
      isImport: data.isImport || false,
      status: 'DRAFT',
    });
    return NextResponse.json({ purchaseBill: bill }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase bill:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
