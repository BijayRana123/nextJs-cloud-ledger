import dbConnect from '@/lib/dbConnect';
import { User, Organization } from '@/lib/models';
import { protect } from '@/lib/middleware/auth'; // Import protect middleware
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const authResponse = await protect(req); // Apply protect middleware
  if (authResponse) {
    return authResponse; // Return authentication error response
  }

  await dbConnect();

  try {
    const requestBody = await req.json(); // Get the entire request body


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

    // Generate a new JWT token with the updated organizationId
    const payload = {
      user: {
        id: user._id,
        organizationId: organization._id, // Use the new organization ID
      },
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    // Set the token as a cookie
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 hour
      sameSite: 'lax',
    };
    const response = NextResponse.json({
      message: 'Organization setup complete',
      organizationId: organization._id,
    });
    response.cookies.set('sb-mnvxxmmrlvjgpnhditxc-auth-token', token, cookieOptions);

    return response;

  } catch (error) {
    console.error('Organization setup error:', error);
    return NextResponse.json({ message: 'Something went wrong during organization setup' }, { status: 500 });
  }
}
