import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const accounts = await ChartOfAccount.find({ active: true }).sort({ code: 1 });
    
    // Simple transformation for hierarchical view
    const accountMap = {};
    const rootAccounts = [];

    accounts.forEach(account => {
      const acc = account.toObject();
      acc.children = [];
      accountMap[acc.code] = acc;

      if (acc.parent) {
        if (accountMap[acc.parent]) {
          accountMap[acc.parent].children.push(acc);
        } else {
          // Parent not processed yet, should be rare with sorted accounts
          rootAccounts.push(acc);
        }
      } else {
        rootAccounts.push(acc);
      }
    });

    return NextResponse.json({ success: true, data: rootAccounts });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.subtype || !body.code) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Build path from parent
    if (body.parent) {
      const parentAccount = await ChartOfAccount.findOne({ code: body.parent });
      if (parentAccount) {
        body.path = `${parentAccount.path}:${body.name}`;
      } else {
        return NextResponse.json({ success: false, error: 'Parent account not found' }, { status: 400 });
      }
    } else {
      // Root account - path is just its name
      body.path = body.name;
    }

    const newAccount = await ChartOfAccount.create(body);

    return NextResponse.json({ success: true, data: newAccount }, { status: 201 });

  } catch (error) {
    if (error.code === 11000) { // Handle duplicate key error for 'code'
      return NextResponse.json({ success: false, error: 'An account with this code already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 