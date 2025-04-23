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

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return NextResponse.json({ token }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
