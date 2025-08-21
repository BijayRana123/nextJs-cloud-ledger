import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Organization } from '@/lib/models';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get organization ID from headers
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Find the organization by ID
    const organization = await Organization.findById(orgId).lean();
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization }, { status: 200 });
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    // Get organization ID from headers
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated via this endpoint
    delete updateData._id;
    delete updateData.organizationId;
    delete updateData.createdAt;
    
    // Update the updatedAt field
    updateData.updatedAt = new Date();

    // Update the organization
    const updatedOrganization = await Organization.findByIdAndUpdate(
      orgId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedOrganization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      organization: updatedOrganization,
      message: 'Organization updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}