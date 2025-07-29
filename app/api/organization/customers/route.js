import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Customer, Supplier } from '@/lib/models';
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

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const customerData = await request.json();
    
    // Check if this customer is also a supplier
    let relatedSupplier = null;
    if (customerData.isAlsoSupplier && customerData.supplierCode) {
      // Find the supplier by code
      relatedSupplier = await Supplier.findOne({ 
        code: customerData.supplierCode,
        organization: organizationId 
      });
      
      if (relatedSupplier) {
        customerData.relatedSupplier = relatedSupplier._id;
      }
    }

    // Generate a unique code if not provided
    if (!customerData.code) {
      const timestamp = Date.now();
      customerData.code = `CUST-${timestamp}`;
    }

    // Set the contact type
    customerData.contactType = 'Customer';

    // Create the new customer
    const newCustomer = new Customer({
      ...customerData,
      organization: organizationId,
    });

    await newCustomer.save();

    // --- Create customer ledger under Accounts Receivable ---
    // Import Ledger and LedgerGroup models
    const { Ledger, LedgerGroup } = await import('@/lib/models');
    // Find or create the Accounts Receivable group for this organization
    let arGroup = await LedgerGroup.findOne({ name: /accounts receivable/i, organization: organizationId });
    if (!arGroup) {
      arGroup = await LedgerGroup.create({ name: 'Accounts Receivable', organization: organizationId });
    }
    // Ledger path: Assets:Accounts Receivable:Customer Name
    const ledgerPath = `Assets:Accounts Receivable:${newCustomer.name}`;
    // Check for existing ledger by name/org
    let existingLedger = await Ledger.findOne({ name: newCustomer.name, organization: organizationId });
    if (!existingLedger) {
      await Ledger.create({
        name: newCustomer.name,
        group: arGroup._id,
        organization: organizationId,
        path: ledgerPath
      });
    }
    // --- End customer ledger creation ---

    // --- Create customer ChartOfAccount under Accounts Receivable ---
    const ChartOfAccount = (await import('@/lib/models/ChartOfAccounts')).default;
    const coaPath = `Assets:Accounts Receivable:${newCustomer.name}`;
    let existingCoa = await ChartOfAccount.findOne({ path: coaPath, organization: organizationId });
    if (!existingCoa) {
      await ChartOfAccount.create({
        code: coaPath.replace(/:/g, ''),
        name: newCustomer.name,
        type: 'asset',
        subtype: 'current',
        path: coaPath,
        organization: organizationId,
        active: true
      });
    }
    // --- End customer ChartOfAccount creation ---

    return NextResponse.json({ 
      message: "Customer created successfully", 
      customer: newCustomer 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    
    // Provide more detailed error message
    let errorMessage = "Failed to create customer";
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => {
        return `${field}: ${error.errors[field].message}`;
      });
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      error: error.message
    }, { status: 500 });
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

    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    // Fetch customers for the authenticated user's organization
    const customers = await Customer.find({ organization: organizationId }).populate('relatedSupplier').lean();

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}