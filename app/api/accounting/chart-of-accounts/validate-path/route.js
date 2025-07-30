import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const authResult = await protect(request);
    if (authResult?.status !== 200) return authResult;

    let name, parentCode, editingId;
    try {
      const body = await request.json();
      name = body.name;
      parentCode = body.parentCode;
      editingId = body.editingId;
    } catch (e) {
      // If body is missing or invalid, treat as no name to validate
      return NextResponse.json({ isUnique: true });
    }

    if (!name) {
      return NextResponse.json({ isUnique: true }); // No name to validate yet
    }

    let basePath = '';
    if (parentCode) {
      const parentAccount = await ChartOfAccount.findOne({ code: parentCode });
      if (parentAccount) {
        basePath = parentAccount.path;
      }
    }
    
    const prospectivePath = basePath ? `${basePath}:${name}` : name;

    const query = {
      path: new RegExp(`^${prospectivePath}$`, 'i') // Case-insensitive match
    };

    // If we're editing, exclude the current account from the check
    if (editingId) {
      query._id = { $ne: editingId };
    }

    const existingAccount = await ChartOfAccount.findOne(query);

    return NextResponse.json({ isUnique: !existingAccount });

  } catch (error) {
    console.error('validate-path API error:', error);
    return NextResponse.json({ isUnique: false, error: error.message }, { status: 500 });
  }
} 
