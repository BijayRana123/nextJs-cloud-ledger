import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

export async function POST(request) {
    await dbConnect();

    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        const orgId = request.organizationId;
        if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });

        // Find all customer accounts that have the wrong path format
        const customerAccounts = await ChartOfAccount.find({
            organization: orgId,
            type: 'asset',
            path: { $regex: /^Assets:[^:]+$/ } // Paths like "Assets:Susmita"
        });



        const results = [];
        for (const account of customerAccounts) {
            const customerName = account.name;
            const oldPath = account.path;
            const newPath = `Assets:Accounts Receivable:${customerName}`;
            
            // Only update if the path is not already correct
            if (oldPath !== newPath) {

                // Update the account path
                await ChartOfAccount.findByIdAndUpdate(account._id, {
                    path: newPath,
                    code: newPath.replace(/:/g, '')
                });
                results.push({
                    id: account._id,
                    name: customerName,
                    oldPath,
                    newPath
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${results.length} customer accounts`,
            results
        });

    } catch (error) {
        console.error("Error fixing customer accounts:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 
