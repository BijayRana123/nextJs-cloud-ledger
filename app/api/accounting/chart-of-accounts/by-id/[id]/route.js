import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function GET(request, { params }) {
    const { id } = params;
    await dbConnect();

    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
        }
        
        const account = await ChartOfAccount.findById(id);
        
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: account });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 