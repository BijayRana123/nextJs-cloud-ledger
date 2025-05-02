import dbConnect from '@/lib/dbConnect';
import { Supplier } from '@/lib/models'; // Import the Supplier model
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { NextResponse } from 'next/server';

export async function GET(req, context) {
  await dbConnect();

  try {
    // Get params from context and await it
    const params = await context.params;
    
    // Authenticate and authorize the user
    const authResult = await protect(req);
    if (authResult && authResult.status !== 200) {
      return authResult; // Return authentication error response
    }

    // Get the organization ID from the request object (set by the auth middleware)
    // This should be the organization ID from the JWT token
    let organizationId = req.organizationId;
    
    // If no organizationId in the token, try to get it from the user's organizations array
    if (!organizationId && req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = req.user.organizations[0];
    }

    // Check if organizationId was found
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    
    console.log(`Supplier API: Using organization ID: ${organizationId}`);

    // Get the supplier ID from the URL parameters after awaiting params
    const supplierId = params.id;
    
    // Log for debugging
    console.log(`Fetching supplier with ID: ${supplierId} for organization: ${organizationId}`);

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
