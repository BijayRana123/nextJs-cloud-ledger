import dbConnect from '@/lib/dbConnect';
import { User, Organization } from '@/lib/models';
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { NextResponse } from 'next/server';

export async function POST(req) {
  const authResponse = await protect(req); // Apply protect middleware
  if (authResponse) {
    return authResponse; // Return authentication error response
  }

  await dbConnect();

  try {
    const requestBody = await req.json(); // Get the entire request body
    console.log('Setup Org API: Received request body:', requestBody); // Log the received body

    const { organizationName } = requestBody; // Get organizationName from the logged body

    if (!organizationName) {
      return NextResponse.json({ message: 'Organization name is required' }, { status: 400 });
    }

    // Get user ID from the authenticated request
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      // This case should ideally not happen if protect middleware is successful
      return NextResponse.json({ message: 'User not found after authentication' }, { status: 404 });
    }

    // Check if organization exists or create a new one
    let organization = await Organization.findOne({ name: organizationName });

    if (!organization) {
      organization = await Organization.create({ name: organizationName });
    }

    // Link the organization to the user's organizations array
    if (!user.organizations.includes(organization._id)) {
        user.organizations.push(organization._id);
        await user.save();
    }


    return NextResponse.json({ message: 'Organization setup complete', organizationId: organization._id }, { status: 200 });

  } catch (error) {
    console.error('Organization setup error:', error);
    return NextResponse.json({ message: 'Something went wrong during organization setup' }, { status: 500 });
  }
}
