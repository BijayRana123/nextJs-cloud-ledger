import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId') || request.headers.get('x-organization-id');

        if (!orgId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        const db = mongoose.connection.db;
        const transactionCollection = db.collection('medici_transactions');

        // Get all transactions for this organization
        const transactions = await transactionCollection
            .find({ organizationId: new mongoose.Types.ObjectId(orgId) })
            .limit(20)
            .sort({ datetime: -1 })
            .toArray();

        // Get unique account names
        const uniqueAccounts = [...new Set(transactions.map(tx => tx.accounts))];

        return NextResponse.json({
            success: true,
            totalTransactions: transactions.length,
            uniqueAccounts,
            sampleTransactions: transactions.slice(0, 5).map(tx => ({
                _id: tx._id,
                accounts: tx.accounts,
                amount: tx.amount,
                debit: tx.debit,
                credit: tx.credit,
                datetime: tx.datetime,
                memo: tx.memo,
                meta: tx.meta,
                reference: tx.reference
            }))
        });

    } catch (error) {
        console.error('Error fetching debug transactions:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch debug transactions',
                details: error.message 
            },
            { status: 500 }
        );
    }
}