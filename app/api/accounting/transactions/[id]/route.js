import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { id } = await params;
        const orgId = request.headers.get('x-organization-id');

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid transaction ID format' 
            }, { status: 400 });
        }

        if (!orgId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Organization ID required' 
            }, { status: 400 });
        }

        // Get the transaction from Medici transactions collection
        const db = mongoose.connection.db;
        const transactionCollection = db.collection('medici_transactions');

        const transaction = await transactionCollection.findOne({
            _id: new mongoose.Types.ObjectId(id),
            organizationId: new mongoose.Types.ObjectId(orgId),
            voided: false
        });

        if (!transaction) {
            return NextResponse.json({ 
                success: false, 
                error: 'Transaction not found' 
            }, { status: 404 });
        }

        // Format the transaction for display
        const formattedTransaction = {
            _id: transaction._id,
            datetime: transaction.datetime,
            date: transaction.datetime,
            reference: transaction.reference || '',
            memo: transaction.memo || transaction.description || '',
            description: transaction.memo || transaction.description || '',
            debit: transaction.debit || false,
            credit: transaction.credit || false,
            amount: transaction.amount || 0,
            accounts: transaction.accounts,
            meta: transaction.meta || {},
            journalId: transaction._journal,
            voided: transaction.voided || false
        };

        return NextResponse.json({
            success: true,
            transaction: formattedTransaction
        });

    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch transaction',
                details: error.message 
            },
            { status: 500 }
        );
    }
}