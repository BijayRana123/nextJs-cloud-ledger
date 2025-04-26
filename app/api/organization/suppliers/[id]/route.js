import dbConnect from '@/lib/dbConnect';
import { Supplier } from '@/lib/models'; // Import the Supplier model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
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

    const supplierId = params.id; // Get the supplier ID from the URL parameters

    // Find the supplier by ID and organization ID
    const supplier = await Supplier.findOne({ _id: supplierId, organization: organizationId });

    if (!supplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    // Return the supplier data
    return NextResponse.json({ supplier }, { status: 200 });

  } catch (error) {
    console.error('Error fetching supplier:', error);
    // TODO: Implement more specific error handling
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// Optional: Add other HTTP methods (PUT, DELETE) if needed for this endpoint
