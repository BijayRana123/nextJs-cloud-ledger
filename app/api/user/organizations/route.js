import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import { protect } from '@/lib/middleware/auth'; // Import protect as a named export
import { NextResponse } from 'next/server';

export async function GET(req) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(req); // Use the named import protect

    if (authResult && authResult.status !== 200) { // Check if authResult is not null before accessing status
      // If authentication fails, return the error response from the middleware
      return authResult; // Return the NextResponse object directly
    }

    // User is authenticated, get the user ID from the modified request object
    // Assuming protect middleware adds user info to req.user
    const userId = req.user._id; // Get user ID from the modified request object

    // Find the user and populate their organizations (plural)
    const user = await User.findById(userId).populate('organizations'); // Populate the 'organizations' array
    if (!user) {
      // This case should ideally not happen if protect middleware is successful
      return NextResponse.json({ message: 'User not found after authentication' }, { status: 404 });
    }

    // Return the user's organizations array
    const organizations = user.organizations || []; // Ensure it's always an array

    return NextResponse.json({ organizations }, { status: 200 });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
