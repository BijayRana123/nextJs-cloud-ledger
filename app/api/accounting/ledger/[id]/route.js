import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ChartOfAccount from '@/lib/models/ChartOfAccounts';
import { Item } from '@/lib/models';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const { id } = await params;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Find the ChartOfAccount
    const account = await ChartOfAccount.findOne({ 
      _id: id, 
      organization: orgId 
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if this is an inventory item account
    let isInventoryItem = false;
    let itemDetails = null;
    let openingStock = 0;
    let closingStock = 0;

    if (account.path.includes('Inventory:')) {
      // Extract item ID from the path or find by name
      try {
        // Try to find item by name first
        const item = await Item.findOne({ 
          name: account.name, 
          organization: orgId 
        });
        
        if (item) {
          isInventoryItem = true;
          itemDetails = item;
          openingStock = item.openingStock || 0;
          // TODO: Calculate closing stock from stock entries
          closingStock = openingStock; // Placeholder
        }
      } catch (error) {
        console.log('Error finding inventory item:', error.message);
      }
    }

    // Get transactions from Medici
    const db = mongoose.connection.db;
    const transactionCollection = db.collection('medici_transactions');

    // Build query for transactions
    const query = {
      accounts: account.path,
      voided: false,
      organizationId: new mongoose.Types.ObjectId(orgId)
    };

    // Get all transactions for this account
    const transactions = await transactionCollection.find(query)
      .sort({ datetime: 1 })
      .toArray();

    // Format transactions for display
    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      datetime: tx.datetime,
      date: tx.datetime,
      reference: tx.reference || '',
      memo: tx.memo || tx.description || '',
      description: tx.memo || tx.description || '',
      debit: tx.debit || false,
      credit: tx.credit || false,
      amount: tx.amount || 0,
      meta: tx.meta || {}
    }));

    const responseData = {
      account: {
        _id: account._id,
        name: account.name,
        code: account.code,
        type: account.type,
        path: account.path,
        openingBalance: 0, // TODO: Calculate opening balance
        itemDetails: itemDetails
      },
      transactions: formattedTransactions,
      isInventoryItem,
      openingStock,
      closingStock
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