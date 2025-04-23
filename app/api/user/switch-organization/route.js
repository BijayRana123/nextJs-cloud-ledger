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

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return NextResponse.json({ token }, { status: 200 });

  } catch (error) {
    console.error('Switch organization error:', error);
    return NextResponse.json({ message: 'Something went wrong while switching organization' }, { status: 500 });
  }
}
