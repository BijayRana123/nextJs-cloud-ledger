import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { Item, StockEntry } from '@/lib/models';
import '@/lib/models'; // Ensure all models are registered

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const orgId = searchParams.get('organizationId') || request.headers.get('x-organization-id');

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid Account ID format' }, { status: 400 });
        }

        if (!orgId) {
            return NextResponse.json({ success: false, error: 'Organization ID required' }, { status: 400 });
        }
        
        const account = await ChartOfAccount.findOne({ 
            _id: id, 
            organization: orgId 
        }).lean();
        
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
        }

        // Check if this is an inventory item account
        const isInventoryItem = account.path && account.path.includes('Inventory:') && 
                               !account.path.endsWith('Inventory') && 
                               account.path.split(':').length > 2;

        if (isInventoryItem) {
            // Handle inventory item - show quantities instead of monetary values
            const itemName = account.path.split(':').pop();
            
            const item = await Item.findOne({ 
                name: itemName, 
                organization: orgId 
            }).lean();
            
            if (!item) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Item not found for this inventory account" 
                }, { status: 404 });
            }

            // Get stock entries for this item
            let stockQuery = { 
                item: item._id, 
                organization: orgId 
            };
            
            if (startDate) stockQuery.date = { $gte: new Date(startDate) };
            if (endDate) stockQuery.date = { ...stockQuery.date, $lte: new Date(endDate) };

            const stockEntries = await StockEntry.find(stockQuery)
                .populate('warehouse', 'name')
                .sort({ date: 1, createdAt: 1 })
                .lean();

            // Calculate opening stock
            let openingStock = item.openingStock || 0;
            if (startDate) {
                const openingEntries = await StockEntry.find({
                    item: item._id,
                    organization: orgId,
                    date: { $lt: new Date(startDate) }
                }).lean();
                
                openingStock = (item.openingStock || 0) + openingEntries.reduce((sum, entry) => sum + entry.quantity, 0);
            }

            // Process stock entries
            let currentStock = openingStock;
            const processedEntries = stockEntries.map((entry) => {
                currentStock += entry.quantity;
                
                return {
                    _id: entry._id,
                    date: entry.date,
                    description: entry.notes || 'Stock Entry',
                    reference: entry.referenceId ? entry.referenceId.toString().slice(-6) : 'Manual',
                    transactionType: entry.transactionType || 'adjustment',
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
        }

        // For regular accounts, use Medici transactions
        const db = mongoose.connection.db;
        const transactionCollection = db.collection('medici_transactions');

        // Build query for transactions - try multiple account formats
        console.log('Searching for transactions with account path:', account.path);
        console.log('Account name:', account.name);
        
        // Extract the main account type from the path
        const pathParts = account.path.split(':');
        const accountType = pathParts[0]; // e.g., "Accounts Payable" from "Accounts Payable:simransis"
        const accountName = pathParts[pathParts.length - 1]; // e.g., "simransis"
        
        // Map common account types to Medici format - case insensitive
        const accountTypeMapping = {
            'Accounts Payable': 'Liabilities:Accounts Payable',
            'Accounts Receivable': 'Assets:Accounts Receivable',
            'Sales Revenue': 'Income:Sales Revenue',
            'Sales': 'Income:Sales Revenue',
            'Revenue': 'Income:Sales Revenue',
            'Income': 'Income:Sales Revenue',
            'Inventory': 'Assets:Inventory',
            'Cash': 'Assets:Cash',
            'cash': 'Assets:Cash',
            'Bank': 'Assets:Bank',
            'Cash-in-Hand': 'Assets:Cash',
            'Bank Accounts': 'Assets:Bank',
            'Capital Account': 'Equity:Capital',
            'Direct Expenses': 'Expenses:Direct Expenses',
            'Sales Account': 'Income:Sales Revenue',
            'Cash-in-Hand': 'Assets:Cash-in-Hand'
        };
        
        // Try case-insensitive mapping first
        let mediciAccountPath = accountTypeMapping[accountType];
        if (!mediciAccountPath) {
            // Try case-insensitive matching
            const lowerAccountType = accountType.toLowerCase();
            for (const [key, value] of Object.entries(accountTypeMapping)) {
                if (key.toLowerCase() === lowerAccountType) {
                    mediciAccountPath = value;
                    break;
                }
            }
        }
        mediciAccountPath = mediciAccountPath || account.path;
        
        console.log('Mapped to Medici account path:', mediciAccountPath);
        console.log('Account type:', accountType, 'Account name:', accountName);
        
        // Build targeted account paths to avoid overmatching (which caused all ledgers to show same txns)
        const candidateAccounts = new Set([
            account.path
        ]);

        const leafName = accountName;
        // Map AR/AP and Cash variations to Medici canonical paths WITH the specific leaf name
        if (accountType === 'Accounts Payable' && leafName) {
            candidateAccounts.add(`Liabilities:Accounts Payable:${leafName}`);
            // Add capitalized versions to handle case variations
            candidateAccounts.add(`Liabilities:Accounts Payable:${leafName.charAt(0).toUpperCase() + leafName.slice(1)}`);
            candidateAccounts.add(`Liabilities:Accounts Payable:${leafName.toLowerCase()}`);
            candidateAccounts.add(`Liabilities:Accounts Payable:${leafName.toUpperCase()}`);
        }
        if (accountType === 'Accounts Receivable' && leafName) {
            candidateAccounts.add(`Assets:Accounts Receivable:${leafName}`);
            // Add capitalized versions
            candidateAccounts.add(`Assets:Accounts Receivable:${leafName.charAt(0).toUpperCase() + leafName.slice(1)}`);
            candidateAccounts.add(`Assets:Accounts Receivable:${leafName.toLowerCase()}`);
            candidateAccounts.add(`Assets:Accounts Receivable:${leafName.toUpperCase()}`);
        }
        if (accountType === 'Cash-in-Hand' && leafName) {
            candidateAccounts.add(`Assets:Cash-in-Hand:${leafName}`);
            candidateAccounts.add(`Assets:Cash-in-Hand:${leafName.charAt(0).toUpperCase() + leafName.slice(1)}`);
        }
        if (accountType === 'Cash' && leafName) {
            candidateAccounts.add(`Assets:Cash:${leafName}`);
            candidateAccounts.add(`Assets:Cash:${leafName.charAt(0).toUpperCase() + leafName.slice(1)}`);
        }
        if (accountName.toLowerCase() === 'cash') {
            candidateAccounts.add('Assets:Cash');
            candidateAccounts.add('Cash');
            candidateAccounts.add('Assets:Cash-in-Hand:Cash');
            candidateAccounts.add('Assets:Cash:Cash');
        }
        
        // For Sales Revenue accounts, add multiple variations
        if (accountType.toLowerCase().includes('sales') || accountType.toLowerCase().includes('revenue') || accountName.toLowerCase().includes('sales')) {
            candidateAccounts.add('Income:Sales Revenue');
            candidateAccounts.add('Revenue:Sales Revenue');
            candidateAccounts.add('Income:Sales');
            candidateAccounts.add('Revenue:Sales');
            candidateAccounts.add(`Income:Sales Revenue:${accountName}`);
            candidateAccounts.add(`Revenue:Sales Revenue:${accountName}`);
            candidateAccounts.add(`Income:${accountName}`);
            candidateAccounts.add(`Revenue:${accountName}`);
        }

        // Instead of exact match, use case-insensitive regex for better matching
        let query;
        if (leafName && (accountType.toLowerCase().includes('payable') || accountType.toLowerCase().includes('receivable'))) {
            // For AP/AR accounts, use regex to match case-insensitively
            const leafNameRegex = leafName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
            query = {
                accounts: { 
                    $regex: `${mediciAccountPath}:${leafNameRegex}$`, 
                    $options: 'i' // Case insensitive
                },
                voided: { $ne: true },
                organizationId: new mongoose.Types.ObjectId(orgId)
            };
        } else if (accountType.toLowerCase().includes('sales') || accountType.toLowerCase().includes('revenue') || account.name.toLowerCase().includes('sales') || account.name.toLowerCase().includes('revenue')) {
            // For Sales/Revenue accounts, use flexible regex matching
            const nameRegex = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query = {
                $or: [
                    { accounts: { $in: Array.from(candidateAccounts) } },
                    { accounts: { $regex: `Income:.*${nameRegex}`, $options: 'i' } },
                    { accounts: { $regex: `Revenue:.*${nameRegex}`, $options: 'i' } },
                    { accounts: { $regex: `.*Sales.*Revenue.*`, $options: 'i' } },
                    { accounts: { $regex: `.*Sales.*`, $options: 'i' } }
                ],
                voided: { $ne: true },
                organizationId: new mongoose.Types.ObjectId(orgId)
            };
        } else {
            // For other accounts, use the enhanced $in approach with case variations
            const allCandidates = new Set(candidateAccounts);
            // Add case variations for all candidates
            candidateAccounts.forEach(candidate => {
                allCandidates.add(candidate.toLowerCase());
                allCandidates.add(candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase());
                allCandidates.add(candidate.toUpperCase());
            });
            
            query = {
                accounts: { $in: Array.from(allCandidates) },
                voided: { $ne: true },
                organizationId: new mongoose.Types.ObjectId(orgId)
            };
        }

        console.log('Using candidate accounts:', Array.from(candidateAccounts));

        // Add date filtering if provided
        if (startDate || endDate) {
            query.datetime = {};
            if (startDate) query.datetime.$gte = new Date(startDate);
            if (endDate) query.datetime.$lte = new Date(endDate);
        }

        // Get transactions sorted by date
        const transactions = await transactionCollection
            .find(query)
            .sort({ datetime: 1 })
            .toArray();
            
        console.log(`Found ${transactions.length} transactions for account ${account.name} (${account.path})`);
        
        // No fallback to unrelated transactions to avoid cross-account leakage

        // Calculate opening balance (transactions before start date)
        let openingBalance = 0;
        if (startDate) {
            let openingQuery;
            if (leafName && (accountType.toLowerCase().includes('payable') || accountType.toLowerCase().includes('receivable'))) {
                // Use the same regex logic for opening balance calculation
                const leafNameRegex = leafName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                openingQuery = {
                    accounts: { 
                        $regex: `${mediciAccountPath}:${leafNameRegex}$`, 
                        $options: 'i' 
                    },
                    voided: { $ne: true },
                    organizationId: new mongoose.Types.ObjectId(orgId),
                    datetime: { $lt: new Date(startDate) }
                };
            } else if (accountType.toLowerCase().includes('sales') || accountType.toLowerCase().includes('revenue') || account.name.toLowerCase().includes('sales') || account.name.toLowerCase().includes('revenue')) {
                // For Sales/Revenue accounts, use the same flexible matching
                const nameRegex = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                openingQuery = {
                    $or: [
                        { accounts: { $in: Array.from(candidateAccounts) } },
                        { accounts: { $regex: `Income:.*${nameRegex}`, $options: 'i' } },
                        { accounts: { $regex: `Revenue:.*${nameRegex}`, $options: 'i' } },
                        { accounts: { $regex: `.*Sales.*Revenue.*`, $options: 'i' } },
                        { accounts: { $regex: `.*Sales.*`, $options: 'i' } }
                    ],
                    voided: { $ne: true },
                    organizationId: new mongoose.Types.ObjectId(orgId),
                    datetime: { $lt: new Date(startDate) }
                };
            } else {
                // For other accounts, use enhanced case-insensitive matching
                const allCandidates = new Set(candidateAccounts);
                candidateAccounts.forEach(candidate => {
                    allCandidates.add(candidate.toLowerCase());
                    allCandidates.add(candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase());
                    allCandidates.add(candidate.toUpperCase());
                });
                
                openingQuery = {
                    accounts: { $in: Array.from(allCandidates) },
                    voided: { $ne: true },
                    organizationId: new mongoose.Types.ObjectId(orgId),
                    datetime: { $lt: new Date(startDate) }
                };
            }

            const openingTransactions = await transactionCollection
                .find(openingQuery)
                .toArray();

            openingBalance = openingTransactions.reduce((balance, tx) => {
                if (tx.credit) return balance + tx.amount;
                if (tx.debit) return balance - tx.amount;
                return balance;
            }, 0);
        }

        // Format transactions for display
        let runningBalance = openingBalance;
        const formattedTransactions = transactions.map(tx => {
            if (tx.credit) runningBalance += tx.amount;
            if (tx.debit) runningBalance -= tx.amount;

            return {
                _id: tx._id,
                datetime: tx.datetime,
                date: tx.datetime,
                reference: tx.reference || '',
                memo: tx.memo || tx.description || '',
                description: tx.memo || tx.description || '',
                debit: tx.debit || false,
                credit: tx.credit || false,
                amount: tx.amount || 0,
                balance: runningBalance,
                meta: tx.meta || {},
                journalId: tx._journal
            };
        });

        const responseData = {
            account: {
                _id: account._id,
                name: account.name,
                code: account.code,
                type: account.type,
                path: account.path,
                openingBalance: openingBalance
            },
            transactions: formattedTransactions,
            isInventoryItem: false,
            openingBalance,
            closingBalance: runningBalance,
            period: { startDate, endDate }
        };

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error fetching account ledger:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch account ledger',
                details: error.message 
            },
            { status: 500 }
        );
    }
}