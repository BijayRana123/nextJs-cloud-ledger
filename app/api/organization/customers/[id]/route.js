import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Customer } from '@/lib/models';
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

    // Get the customer ID from the URL params
    const params = await context.params;
    const id = params.id;

    // Fetch the customer by ID and organization ID
    const customer = await Customer.findOne({ 
      _id: id, 
      organization: organizationId 
    }).populate('relatedSupplier');

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
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

    // Get the customer ID from the URL params
    const params = await context.params;
    const id = params.id;

    // Get the updated customer data from the request body
    const customerData = await request.json();

    // Update the customer
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: id, organization: organizationId },
      customerData,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Customer updated successfully", 
      customer: updatedCustomer 
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
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

    // Get the customer ID from the URL params
    const params = await context.params;
    const id = params.id;

    // Delete the customer
    const result = await Customer.deleteOne({ _id: id, organization: organizationId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}