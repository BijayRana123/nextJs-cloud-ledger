import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    // Find user by email and populate organizations (plural)
    const user = await User.findOne({ email }).populate('organizations'); // Populate the 'organizations' array
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        // Remove organizationId from payload as user can have multiple organizations
      },
    };

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
    const cookieValue = JSON.stringify([token]); // Wrap token in array as expected by middleware
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

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
