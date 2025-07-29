import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Unit } from '@/lib/models';
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
    const units = await Unit.find({ organization: organizationId }).lean();
    return NextResponse.json({ units }, { status: 200 });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 