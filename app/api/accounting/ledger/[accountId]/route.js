import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { getBook } from '@/lib/accounting';
import { protect } from '@/lib/middleware/auth';
import { Item, StockEntry } from '@/lib/models';
import '@/lib/models'; // Ensure all models are registered

// Helper function to handle inventory item ledger (quantity-based)
async function handleInventoryItemLedger(account, startDate, endDate) {
    try {
        // Extract item name from the account path (e.g., "Inventory:ItemName" -> "ItemName")
        const itemName = account.path.split(':').pop();
        
        // Find the item by name and organization
        const item = await Item.findOne({ 
            name: itemName, 
            organization: account.organization 
        }).lean();
        
        if (!item) {
            return NextResponse.json({ 
                success: false, 
                error: "Item not found for this inventory account" 
            }, { status: 404 });
        }

        // Get all stock entries for this item
        let stockQuery = { 
            item: item._id, 
            organization: account.organization 
        };
        
        if (startDate) stockQuery.date = { $gte: new Date(startDate) };
        if (endDate) stockQuery.date = { ...stockQuery.date, $lte: new Date(endDate) };

        const stockEntries = await StockEntry.find(stockQuery)
            .populate('warehouse', 'name')
            .sort({ date: 1, createdAt: 1 })
            .lean();

        // Calculate opening stock (entries before start date)
        let openingStock = item.openingStock || 0;
        if (startDate) {
            const openingEntries = await StockEntry.find({
                item: item._id,
                organization: account.organization,
                date: { $lt: new Date(startDate) }
            }).lean();
            
            openingStock = (item.openingStock || 0) + openingEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        }

        // Get related transactions from Medici to identify transaction types
        const transactionModel = mongoose.model('Medici_Transaction');
        const journalModel = mongoose.model('Medici_Journal');

        // Process stock entries and get transaction details
        let currentStock = openingStock;
        const processedEntries = stockEntries.map((entry) => {
            currentStock += entry.quantity;
            
            let description = 'Stock Entry';
            let reference = 'Manual Entry';
            let transactionType = 'Stock Entry';
            
            // Use the transactionType from the stock entry
            switch (entry.transactionType) {
                case 'opening':
                    transactionType = 'Opening Stock';
                    description = 'Opening Stock Entry';
                    reference = 'Opening Stock';
                    break;
                case 'sales':
                    transactionType = 'Sales';
                    description = 'Stock sold to customer';
                    reference = entry.referenceId ? `SV-${entry.referenceId.toString().slice(-6)}` : 'Sales Voucher';
                    break;
                case 'purchase':
                    transactionType = 'Purchase';
                    description = 'Stock purchased from supplier';
                    reference = entry.referenceId ? `PO-${entry.referenceId.toString().slice(-6)}` : 'Purchase Order';
                    break;
                case 'sales_return':
                    transactionType = 'Sales Return';
                    description = 'Stock returned by customer';
                    reference = entry.referenceId ? `SR-${entry.referenceId.toString().slice(-6)}` : 'Sales Return';
                    break;
                case 'purchase_return':
                    transactionType = 'Purchase Return';
                    description = 'Stock returned to supplier';
                    reference = entry.referenceId ? `PR-${entry.referenceId.toString().slice(-6)}` : 'Purchase Return';
                    break;
                case 'adjustment':
                default:
                    transactionType = 'Stock Adjustment';
                    description = entry.notes || 'Stock adjustment';
                    reference = 'Adjustment';
                    break;
            }
            
            return {
                _id: entry._id,
                date: entry.date,
                description,
                reference,
                transactionType,
                quantityIn: entry.quantity > 0 ? entry.quantity : 0,
                quantityOut: entry.quantity < 0 ? Math.abs(entry.quantity) : 0,
                balance: currentStock,
                warehouse: entry.warehouse?.name || 'Main Warehouse'
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                account: {
                    ...account,
                    itemDetails: item
                },
                period: { startDate, endDate },
                openingStock,
                transactions: processedEntries,
                closingStock: currentStock,
                isInventoryItem: true
            }
        });

    } catch (error) {
        console.error("Error in handleInventoryItemLedger:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}

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
        // Try to authenticate, but don't fail if no auth is provided
        let authResult;
        try {
            authResult = await protect(request);
        } catch (authError) {

            // Continue without authentication for now
        }

        const { accountId } = await params;
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!accountId || !accountId.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ success: false, error: 'Invalid Account ID format' }, { status: 400 });
        }
        
        const account = await ChartOfAccount.findById(accountId).lean();
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        // Check if this is an inventory item account
        const isInventoryItem = account.path && account.path.includes('Inventory:') && 
                               !account.path.endsWith('Inventory') && 
                               account.path.split(':').length > 2;

        if (isInventoryItem) {
            // Handle inventory item - show quantities instead of monetary values
            return await handleInventoryItemLedger(account, startDate, endDate);
        }

        const book = await getBook();
        
        // For balance calculation, we need to check all possible paths too
        let openingBalance = 0;
        const possibleBalancePaths = [
            account.path,
            `Assets:${account.path}`,
            `Assets:Current Assets:${account.path}`,
        ];
        
        if (account.path.startsWith('Assets:')) {
            const pathWithoutAssets = account.path.replace(/^Assets:/, '');
            possibleBalancePaths.push(pathWithoutAssets);
            const pathWithoutCurrentAssets = account.path.replace(/^Assets:Current Assets:/, '');
            possibleBalancePaths.push(pathWithoutCurrentAssets);
        }
        
        // Try each possible path for balance calculation
        for (const balancePath of possibleBalancePaths) {
            const balanceQuery = { account: balancePath };
            if (startDate) balanceQuery.endDate = new Date(new Date(startDate).getTime() - 1);
            
            try {
                const balanceResult = await book.balance(balanceQuery);
                if (balanceResult.balance !== 0) {
                    openingBalance = balanceResult.balance;

                    break;
                }
            } catch (error) {

            }
        }

        // Debug: Print ChartOfAccount path and transaction query

        
        // Build possible account paths to search for
        const possiblePaths = [
            account.path, // Original path from ChartOfAccount
            `Assets:${account.path}`, // Full path with Assets prefix
            `Assets:Current Assets:${account.path}`, // Full path with Current Assets
        ];
        
        // If the path already starts with Assets, also try without it
        if (account.path.startsWith('Assets:')) {
            const pathWithoutAssets = account.path.replace(/^Assets:/, '');
            possiblePaths.push(pathWithoutAssets);
            const pathWithoutCurrentAssets = account.path.replace(/^Assets:Current Assets:/, '');
            possiblePaths.push(pathWithoutCurrentAssets);
        }
        
        // Also add capitalized versions (since standardizeAccountName capitalizes names)
        const capitalizedPaths = possiblePaths.map(path => {
            const parts = path.split(':');
            return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(':');
        });
        possiblePaths.push(...capitalizedPaths);
        

        
        // Build the main query with possible paths
        let transactionQuery = {
            $or: possiblePaths.map(path => ({ accounts: new RegExp(`^${path}`) }))
        };
        
        // If this is a customer account (Accounts Receivable), also search for generic AR transactions with customer metadata
        if (account.path.includes('Accounts Receivable:')) {
            const customerName = account.path.split(':').pop(); // Get the customer name from the path
            
            // We need to find the actual customer ID from the customer name
            // First, let's try to find the customer by name
            try {
                const Customer = mongoose.models.Customer || mongoose.model('Customer');
                const customer = await Customer.findOne({ 
                    name: customerName, 
                    organization: account.organization 
                }).lean();
                
                if (customer) {

                    
                    // Add additional query for generic Accounts Receivable transactions that have this customer ID
                    transactionQuery.$or.push({
                        accounts: new RegExp('^Assets:Accounts Receivable$'),
                        'meta.customerId': customer._id
                    });
                    
                    // Also try with exact string match for the account
                    transactionQuery.$or.push({
                        accounts: 'Assets:Accounts Receivable',
                        'meta.customerId': customer._id
                    });
                    

                } else {

                }
            } catch (error) {
                console.error('Error finding customer:', error);
            }
        }
        
        // If organizationId is available, include it in the query
        if (account.organization) {
            transactionQuery.organizationId = account.organization;
        }
        if (startDate) transactionQuery.datetime = { $gte: new Date(startDate) };
        if (endDate) transactionQuery.datetime = { ...transactionQuery.datetime, $lte: new Date(endDate) };


        const transactionModel = mongoose.model('Medici_Transaction');
        const journalModel = mongoose.model('Medici_Journal');
        
        let transactions = await transactionModel.find(transactionQuery).sort({ datetime: 1, timestamp: 1 }).lean();
        

        
        // If no transactions found, let's try a broader search to see what's actually in the database
        if (transactions.length === 0) {
            const broadQuery = { organizationId: account.organization };
            const allTransactions = await transactionModel.find(broadQuery).sort({ datetime: -1 }).limit(15).lean();
            
            // Let's also check what customer the transactions actually belong to
            const uniqueCustomerIds = [...new Set(allTransactions
                .filter(tx => tx.meta?.customerId)
                .map(tx => tx.meta.customerId.toString()))];
            

            
            // Look up these customers
            try {
                const Customer = mongoose.models.Customer || mongoose.model('Customer');
                for (const customerId of uniqueCustomerIds) {
                    const customer = await Customer.findById(customerId).lean();

                }
            } catch (error) {
                console.error('Error looking up customers:', error);
            }
        }
        
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