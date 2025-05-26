import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Organization, User } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    // You may need to adjust this depending on how you store user info in the request
    const userId = request.userId || request.user?._id || request.userIdFromToken;
    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }
    const user = await User.findById(userId).populate('organizations');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ organizations: user.organizations }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
