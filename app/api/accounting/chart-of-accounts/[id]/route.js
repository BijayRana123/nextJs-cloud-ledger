import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { protect } from '@/lib/middleware/auth';

/**
 * Recursively updates the path of all children of a renamed account.
 * @param {string} oldPath - The original path of the parent account (e.g., "Assets:Current Assets").
 * @param {string} newPath - The new path of the parent account (e.g., "Assets:Cash and Equivalents").
 */
async function recursivePathUpdate(oldPath, newPath) {
    // Find all accounts that have the old path as a prefix
    const children = await ChartOfAccount.find({ path: new RegExp(`^${oldPath}:`, 'i') });

    for (const child of children) {
        // Replace the old parent path segment with the new one
        const updatedChildPath = child.path.replace(oldPath, newPath);
        await ChartOfAccount.updateOne({ _id: child._id }, { $set: { path: updatedChildPath } });
    }
}


export async function PUT(request, { params }) {
    const { id } = params;
    await dbConnect();

    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        const body = await request.json();
        const { name, description, type, subtype } = body;

        const accountToUpdate = await ChartOfAccount.findById(id);
        if (!accountToUpdate) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        // If the name is changing, we must update the path for this account and all its descendants.
        if (name && name !== accountToUpdate.name) {
            const oldPath = accountToUpdate.path;
            const pathParts = oldPath.split(':');
            pathParts[pathParts.length - 1] = name; // Replace the last part with the new name
            const newPath = pathParts.join(':');
            
            // Recursively update all children before saving the parent
            await recursivePathUpdate(oldPath, newPath);

            accountToUpdate.path = newPath;
        }
        
        // Update other editable fields
        if (name) accountToUpdate.name = name;
        if (description !== undefined) accountToUpdate.description = description;
        if (type) accountToUpdate.type = type;
        if (subtype) accountToUpdate.subtype = subtype;

        await accountToUpdate.save();

        return NextResponse.json({ success: true, data: accountToUpdate });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    await dbConnect();
    
    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        const accountToDelete = await ChartOfAccount.findById(id);
        if (!accountToDelete) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        // Prevent deletion if the account has children
        const children = await ChartOfAccount.find({ parent: accountToDelete.code });
        if (children.length > 0) {
            return NextResponse.json({ success: false, error: "Cannot delete account with sub-accounts. Please delete them first." }, { status: 400 });
        }

        // Add check for transactions later
        // const transactions = await mongoose.model('Medici_Transaction').find({ accounts: new RegExp(`^${accountToDelete.path}`) }).limit(1);
        // if (transactions.length > 0) {
        //     return NextResponse.json({ success: false, error: "Cannot delete account with transactions." }, { status: 400 });
        // }

        await ChartOfAccount.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 