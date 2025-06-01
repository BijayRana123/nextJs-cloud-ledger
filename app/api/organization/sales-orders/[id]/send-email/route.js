import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const id = params?.id;
  try {
    const { to, replyTo, subject, body, pdfBase64, pdfFileName } = await request.json();

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
      to,
      replyTo,
      subject,
      text: body,
      attachments: pdfBase64 && pdfFileName ? [
        {
          filename: pdfFileName,
          content: Buffer.from(pdfBase64.split(',')[1] || pdfBase64, 'base64'),
          encoding: 'base64',
        },
      ] : [],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Sales order send-email error:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
} 