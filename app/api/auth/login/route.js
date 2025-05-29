import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    // Find user by email and populate organizations (only _id and name)
    const user = await User.findOne({ email })
      .populate({ path: 'organizations', select: '_id name' })
      .lean();
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    // If user has organizations, include the first one as the default
    const defaultOrganizationId = user.organizations && user.organizations.length > 0 
      ? user.organizations[0]._id 
      : null;
    
    const payload = {
      user: {
        id: user._id,
        organizationId: defaultOrganizationId, // Include default organization ID
      },
    };
    
    console.log('Login API: Using default organization ID:', defaultOrganizationId);

    console.log('Login API: JWT_SECRET used for signing:', process.env.JWT_SECRET); // Temporary log
    console.log('Login API: Payload to sign:', payload);

    // Ensure JWT_SECRET is a string and not undefined
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    console.log('Login API: Using JWT_SECRET:', jwtSecret);

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    
    // Log the token format for debugging
    console.log('Login API: Generated token format check - parts:', token.split('.').length);
    console.log('Login API: Token preview:', token.substring(0, 20) + '...');

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
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
