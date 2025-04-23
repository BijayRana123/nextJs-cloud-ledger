import dbConnect from '@/lib/dbConnect';
import { User, Organization } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user without organization initially
    const user = await User.create({
      email,
      password: hashedPassword,
      // organization will be linked in a separate step
    });

    console.log('Signup API: User object created:', user); // Temporary log

    return NextResponse.json({ message: 'User created successfully', user: user._id }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
