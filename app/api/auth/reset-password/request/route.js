import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await dbConnect();

  try {
    const { email } = await req.json();

    const user = await User.findOne({ email });

    // Even if user is not found, return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If a user with that email exists, a password reset email has been sent.' }, { status: 200 });
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${process.env.NEXT_PUBLIC_FRONTEND_URL}/reset-password?token=${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'If a user with that email exists, a password reset email has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
