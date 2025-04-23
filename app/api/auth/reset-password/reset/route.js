import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const { token, newPassword } = await req.json();

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Password reset token is invalid or has expired.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
