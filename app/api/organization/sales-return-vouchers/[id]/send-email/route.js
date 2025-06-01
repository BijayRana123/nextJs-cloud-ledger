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

    // Setup email data
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      replyTo: replyTo,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBase64.split('base64,')[1],
          encoding: 'base64',
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
  }
}