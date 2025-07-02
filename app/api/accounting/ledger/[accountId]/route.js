import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { getBook } from '@/lib/accounting';
import { protect } from '@/lib/middleware/auth';
import '@/lib/models'; // Ensure all models are registered

// Helper function to get voucher number (similar to Day Book & General Ledger)
async function getVoucherNumber(transaction, journal) {
    if (journal && journal.voucherNumber) return journal.voucherNumber;
    if (transaction.meta?.voucherNumber) return transaction.meta.voucherNumber;
    if (transaction.meta?.voucherType && transaction.meta?.voucherId) {
        const modelName = `${transaction.meta.voucherType.charAt(0).toUpperCase() + transaction.meta.voucherType.slice(1)}Voucher`;
        try {
            const model = mongoose.model(modelName);
            const voucher = await model.findById(transaction.meta.voucherId).select('voucherNo referenceNo').lean();
            return voucher?.voucherNo || voucher?.referenceNo || transaction._journal ? transaction._journal.toString() : 'N/A';
        } catch (e) {
            return transaction._journal ? transaction._journal.toString() : 'N/A';
        }
    }
    return transaction._journal ? transaction._journal.toString() : 'N/A';
}

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const authResult = await protect(request);
        if (authResult?.status !== 200) return authResult;

        const { accountId } = params;
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!accountId.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ success: false, error: 'Invalid Account ID format' }, { status: 400 });
        }
        
        const account = await ChartOfAccount.findById(accountId).lean();
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        const book = await getBook();
        
        const balanceQuery = { account: account.path };
        if (startDate) balanceQuery.endDate = new Date(new Date(startDate).getTime() - 1);

        const openingBalanceResult = await book.balance(balanceQuery);
        const openingBalance = openingBalanceResult.balance;

        const transactionQuery = {
            accounts: new RegExp(`^${account.path}`),
        };
        if (startDate) transactionQuery.datetime = { $gte: new Date(startDate) };
        if (endDate) transactionQuery.datetime = { ...transactionQuery.datetime, $lte: new Date(endDate) };

        const transactionModel = mongoose.model('Medici_Transaction');
        const journalModel = mongoose.model('Medici_Journal');
        
        const transactions = await transactionModel.find(transactionQuery).sort({ datetime: 1, timestamp: 1 }).lean();
        
        const journalIds = [...new Set(transactions.map(tx => tx._journal?.toString()).filter(Boolean))];
        const journals = await journalModel.find({ _id: { $in: journalIds } }).lean();
        const journalsMap = new Map(journals.map(j => [j._id.toString(), j]));

        let currentBalance = openingBalance;
        const processedTransactions = await Promise.all(transactions.map(async tx => {
            const debit = tx.debit ? tx.amount : 0;
            const credit = tx.credit ? tx.amount : 0;
            
            if (['asset', 'expense'].includes(account.type.toLowerCase())) {
                currentBalance += (debit - credit);
            } else {
                currentBalance += (credit - debit);
            }

            const journal = tx._journal ? journalsMap.get(tx._journal.toString()) : null;
            const voucherNumber = await getVoucherNumber(tx, journal);

            return {
                ...tx,
                date: tx.datetime,
                description: journal?.memo || tx.memo,
                reference: voucherNumber,
                debit,
                credit,
                balance: currentBalance
            };
        }));
        
        return NextResponse.json({ 
            success: true, 
            data: {
                account,
                period: { startDate, endDate },
                openingBalance,
                transactions: processedTransactions,
                closingBalance: currentBalance
            }
        });

    } catch (error) {
        console.error("Error fetching account ledger:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 