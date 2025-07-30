import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { getBook } from '@/lib/accounting';
// Import all models to ensure they are registered with Mongoose
import '@/lib/models';
import '@/lib/models/PaymentVoucher';
import '@/lib/models/ReceiptVoucher';

// Helper function to reliably get the voucher number for a transaction
async function getVoucherNumber(transaction, journal) {
  // 1. From the journal itself
  if (journal && journal.voucherNumber) {
    return journal.voucherNumber;
  }

  // 2. From the transaction's meta data (pre-composed)
  const meta = transaction.meta;
  if (!meta) return null;

  const precomposedNumber = meta.voucherNumber || meta.receiptVoucherNumber || meta.paymentVoucherNumber || meta.salesVoucherNumber || meta.referenceNo;
  if (precomposedNumber) {
    return precomposedNumber;
  }

  // 3. From related voucher documents via ID in meta
  const modelMap = {
    paymentVoucherId: { model: 'PaymentVoucher', field: 'paymentVoucherNumber' },
    contraVoucherId: { model: 'ContraVoucher', field: 'referenceNo' },
    journalVoucherId: { model: 'JournalVoucher', field: 'referenceNo' },
    purchaseOrderId: { model: 'PurchaseOrder', field: 'referenceNo' },
    salesReturnId: { model: 'SalesReturnVoucher', field: 'referenceNo' },
    purchaseReturnId: { model: 'PurchaseReturnVoucher', field: 'referenceNo' },
    salesVoucherId: { model: 'SalesVoucher', field: 'salesVoucherNumber' }
  };

  for (const [idKey, { model, field }] of Object.entries(modelMap)) {
    if (meta[idKey] && mongoose.models[model]) {
      try {
        const doc = await mongoose.models[model].findById(meta[idKey]).select(field).lean();
        if (doc && doc[field]) {
          return doc[field];
        }
      } catch(e) {
        console.error(`Error finding voucher by ID ${meta[idKey]} in model ${model}:`, e.message);
      }
    }
  }

  return null;
}

export async function POST(request) {
  try {
    // Ensure MongoDB is connected
    await dbConnect();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database connection not established' },
        { status: 500 }
      );
    }

    // Parse request body to get parameters
    const body = await request.json();
    const startDate = body.startDate ? new Date(body.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = body.endDate ? new Date(body.endDate) : new Date();
    const account = body.account || null;
    
    // Get organizationId from body, then request, then headers
    let organizationId = body.organizationId || request.organizationId;
    if (!organizationId && request.headers && request.headers.get) {
      organizationId = request.headers.get('x-organization-id');
    }
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }
    
    // Create query to get transactions
    let orgId = organizationId;
    if (typeof orgId === 'string' || (orgId && orgId.constructor && orgId.constructor.name !== 'ObjectId')) {
      orgId = new mongoose.Types.ObjectId(organizationId);
    }
    const query = {
      organizationId: orgId
    };

    
    // If account is specified, filter by that account
    if (account) {
      query.accounts = { $regex: new RegExp(`^${account}`, 'i') }; // Case-insensitive
    }
    
    // Get transactions
    const transactionModel = mongoose.model('Medici_Transaction');
    const journalModel = mongoose.model('Medici_Journal');
    const transactions = await transactionModel.find(query)
      .sort({ datetime: -1 }) // Sort by date descending
      .lean();

    // Fetch all related journals in one go for efficiency
    const journalIds = Array.from(new Set(transactions.map(tx => tx._journal?.toString()).filter(Boolean)));
    const journals = await journalModel.find({ _id: { $in: journalIds } }).select('_id voucherNumber').lean();
    const journalMap = journals.reduce((map, j) => {
        map[j._id.toString()] = j;
        return map;
    }, {});

    // Prepare flat transaction list with voucherNumber
    const flatTransactions = await Promise.all(transactions.map(async (transaction) => {
        const journal = transaction._journal ? journalMap[transaction._journal.toString()] : null;
        const voucherNumber = await getVoucherNumber(transaction, journal);

        return {
          id: transaction._id.toString(),
          date: transaction.datetime,
          account: transaction.accounts,
          memo: transaction.memo,
          debit: transaction.debit,
          credit: transaction.credit,
          amount: transaction.amount,
          journalId: transaction._journal ? transaction._journal.toString() : null,
          voucherNumber: voucherNumber
        };
    }));
    
    // Format response
    const response = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      account: account,
      transactions: flatTransactions
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating general ledger:", error);
    return NextResponse.json(
      { error: 'Failed to generate general ledger', details: error.message },
      { status: 500 }
    );
  }
} 
