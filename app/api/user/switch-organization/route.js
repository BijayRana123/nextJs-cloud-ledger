import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import jwt from 'jsonwebtoken';
import { protect } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const authResponse = await protect(req);
  if (authResponse) {
    return authResponse;
  }

  await dbConnect();

  try {
    const { newOrganizationId } = await req.json();
    console.log('Switch Org API: Received newOrganizationId:', newOrganizationId); // Log received org ID

    // Get user ID from the authenticated request
    const userId = req.user._id;
    console.log('Switch Org API: Authenticated userId:', userId); // Log authenticated user ID


    // Find the user and populate organizations to check membership
    const user = await User.findById(userId).populate('organizations');
    if (!user) {
       // This case should ideally not happen if protect middleware is successful
      return NextResponse.json({ message: 'User not found after authentication' }, { status: 404 });
    }
    console.log('Switch Org API: User organizations after populate:', user.organizations); // Log populated organizations


    // Check if the user belongs to the new organization
    const organizationExists = user.organizations.some(org => {
        console.log(`Switch Org API: Comparing org ID ${org._id.toString()} with target ID ${newOrganizationId}`); // Log comparison
        return org._id.toString() === newOrganizationId;
    });
    console.log('Switch Org API: Organization existence check result:', organizationExists); // Log check result


    if (!organizationExists) {
      return NextResponse.json({ message: 'User does not belong to this organization' }, { status: 403 });
    }

    // Generate a new JWT with the updated organization ID
    const payload = {
      user: {
        id: user._id,
        organizationId: newOrganizationId, // Use the new organization ID
      },
    };

    // Ensure JWT_SECRET is a string and not undefined (same as in login route)
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    console.log('Switch Org API: Using JWT_SECRET:', jwtSecret);
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    
    // Set the token as a cookie that can be accessed by JavaScript
    // Store the token directly without wrapping in an array to avoid parsing issues
    const cookieValue = token;
    const cookieOptions = {
      httpOnly: false, // Allow JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      path: '/', // Cookie accessible from all paths
      maxAge: 60 * 60, // 1 hour in seconds, matches JWT expiration
      sameSite: 'lax', // Allow cross-site requests when following links
    };

    const response = NextResponse.json({ token }, { status: 200 });

    // Set the cookie in the response headers
    response.cookies.set('sb-mnvxxmmrlvjgpnhditxc-auth-token', cookieValue, cookieOptions);
    
    // For backward compatibility, also set the array format in a different cookie
    const arrayFormatCookie = JSON.stringify([token]);
    response.cookies.set('sb-mnvxxmmrlvjgpnhditxc-auth-token-array', arrayFormatCookie, cookieOptions);

    return response;

  } catch (error) {
    console.error('Switch organization error:', error);
    return NextResponse.json({ message: 'Something went wrong while switching organization' }, { status: 500 });
  }
}
