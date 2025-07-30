import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
    await dbConnect();
    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        // Check if any accounts exist to prevent accidental re-seeding
        const count = await ChartOfAccount.countDocuments();
        if (count > 0) {
            return NextResponse.json({ success: false, message: 'Chart of Accounts has already been seeded.' }, { status: 409 });
        }

        // Call the static method from the model to create default accounts
        await ChartOfAccount.createDefaultAccounts();
        
        const newCount = await ChartOfAccount.countDocuments();
        return NextResponse.json({ success: true, message: `Successfully seeded ${newCount} accounts.` });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 
