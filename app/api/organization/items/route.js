import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Item } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    const items = await Item.find({ organization: organizationId });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch items', error: error.message }, { status: 500 });
  }
} 