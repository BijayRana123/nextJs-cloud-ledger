import dbConnect from '@/lib/dbConnect';
import { Organization } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const authResponse = await protect(req);
  if (authResponse) {
    return authResponse;
  }

  await dbConnect();

  try {
    const { organizationName } = await req.json();

    // Check if organization name is already taken
    const existingOrganization = await Organization.findOne({ name: organizationName });
    if (existingOrganization) {
      return NextResponse.json({ message: 'Organization name already taken' }, { status: 400 });
    }

    // Create new organization
    const organization = await Organization.create({ name: organizationName });

    // Note: You might want to automatically associate the creating user with this new organization
    // This could be done by updating the user document here or in a separate step/route.

    return NextResponse.json({ message: 'Organization created successfully', organization }, { status: 201 });

  } catch (error) {
    console.error('Create organization error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
