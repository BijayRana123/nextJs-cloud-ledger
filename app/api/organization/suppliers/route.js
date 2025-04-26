import dbConnect from '@/lib/dbConnect';
import { Supplier } from '@/lib/models'; // Import the Supplier model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { NextResponse } from 'next/server';

export async function GET(req) {
  await dbConnect();

  try {
    // Authenticate and authorize the user
    const authResult = await protect(req);
    if (authResult && authResult.status !== 200) {
      return authResult; // Return authentication error response
    }

    // Assuming protect middleware adds user info to req.user
    // Get the organization ID from the authenticated user's organizations array
    const organizationId = req.user.organizations && req.user.organizations.length > 0 ? req.user.organizations[0] : null;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'User is not associated with an organization' }, { status: 400 });
    }

    // Find all suppliers for the organization
    const suppliers = await Supplier.find({ organization: organizationId });

    // Return the list of suppliers
    return NextResponse.json({ suppliers }, { status: 200 });

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    // TODO: Implement more specific error handling
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();

  try {
    // Authenticate and authorize the user
    const authResult = await protect(req);
    if (authResult && authResult.status !== 200) {
      return authResult; // Return authentication error response
    }

    // Assuming protect middleware adds user info to req.user
    // Get the organization ID from the authenticated user's organizations array
    // Assuming the user is associated with at least one organization and we use the first one
    const organizationId = req.user.organizations && req.user.organizations.length > 0 ? req.user.organizations[0] : null;

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'User is not associated with an organization' }, { status: 400 });
    }

    const body = await req.json();

    // Basic validation
    if (!body.name || !body.contactType || !body.code) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if a supplier with the same code already exists in this organization
    const existingSupplier = await Supplier.findOne({ organization: organizationId, code: body.code });
    if (existingSupplier) {
      return NextResponse.json({ message: 'Supplier with this code already exists in your organization' }, { status: 409 });
    }

    // Create a new supplier instance
    const newSupplier = new Supplier({
      ...body, // Include other fields from the request body
      organization: organizationId, // Associate with the user's organization
    });

    // Save the supplier to the database
    await newSupplier.save();

    // Return the created supplier data
    return NextResponse.json({ supplier: newSupplier }, { status: 201 });

  } catch (error) {
    console.error('Error creating supplier:', error);
    // TODO: Implement more specific error handling based on error types
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
