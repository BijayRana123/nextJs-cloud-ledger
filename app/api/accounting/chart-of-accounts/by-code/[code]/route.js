import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
    const { code } = params;
    await dbConnect();

    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        const account = await ChartOfAccount.findOne({ code: code });
        
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: account });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 