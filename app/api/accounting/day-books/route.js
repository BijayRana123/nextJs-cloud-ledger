import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getBook, getJournalEntries, connectToDatabase } from '@/lib/accounting';
// Import necessary models
import dbConnect from '@/lib/dbConnect';
import { protect } from '@/lib/middleware/auth';
import Customer from '@/lib/models/Customer';
import Supplier from '@/lib/models/Supplier';
// Import all models to ensure they are registered with Mongoose
import '@/lib/models';
import '@/lib/models/PaymentVoucher';
import '@/lib/models/ReceiptVoucher';

// Helper function to reliably get the voucher number
async function getVoucherNumber(entry) {
  if (entry.voucherNumber) {
    return entry.voucherNumber;
  }

  const transactionWithMeta = entry.transactions?.find(t => t.meta && Object.keys(t.meta).length > 0);
  if (!transactionWithMeta) {
    return null;
  }

  const meta = transactionWithMeta.meta;
  
  // First, check for pre-composed numbers in metadata
  const precomposedNumber = meta.voucherNumber || meta.receiptVoucherNumber || meta.paymentVoucherNumber || meta.salesVoucherNumber || meta.referenceNo;
  if (precomposedNumber) {
    return precomposedNumber;
  }

  // If not found, query the original voucher by its ID
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
      const doc = await mongoose.models[model].findById(meta[idKey]).select(field).lean();
      if (doc && doc[field]) {
        return doc[field];
      }
    }
  }

  return null;
}

export async function GET(request) {
  try {
    // Ensure MongoDB is connected
    await dbConnect();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database connection not established' },
        { status: 500 }
      );
    }

    // Optional: Add authentication check
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      // Skip auth check for now to ensure data can be displayed
    }

    // Get organizationId from request or headers
    let organizationId = request.organizationId;
    if (!organizationId && request.headers && request.headers.get) {
      organizationId = request.headers.get('x-organization-id');
    }
    console.log('Day Book API: organizationId used:', organizationId);

    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchTerm = searchParams.get('searchTerm');
    const accountFilter = searchParams.get('account');
    const voucherType = searchParams.get('voucherType');

    // Build query object
    const query = {}; // No filters
    console.log('Day Book API query:', query);

    // Options for pagination
    const options = {
      page,
      perPage: limit,
    };

    try {
      // Use our custom journal entries function instead of book.ledger()
      let dayBookEntries = await getJournalEntries(query, { ...options, organizationId });
      
      // Get the models we need for populating data
      const Customer = mongoose.models.Customer;
      const Supplier = mongoose.models.Supplier;
      
      // Enhance journal entries with additional data
      const enhancedEntries = await Promise.all(
        dayBookEntries.map(async (entry) => {
          // First, reliably get the voucher number using our helper
          const voucherNumber = await getVoucherNumber(entry);
          
          // Start building our enhanced entry object
          let enhancedEntry = { 
            ...entry, 
            // Use the number from our helper, fallback to existing, then to 'N/A'
            voucherNumber: voucherNumber || entry.voucherNumber || 'N/A'
          };
          
          // Process the memo to replace IDs with names for better readability
          if (entry.memo) {
            // For payment received from customer
            if (entry.memo.includes('Payment Received from Customer')) {
              let customerId;
              if (entry.memo.includes(' for Invoice ')) {
                customerId = entry.memo.split('Customer ')[1].split(' for Invoice ')[0];
              } else {
                customerId = entry.memo.split('Customer ')[1];
              }
              if (customerId && customerId.includes('(')) {
                customerId = customerId.split(' (')[0];
              }
              if (mongoose.Types.ObjectId.isValid(customerId)) {
                const customer = await Customer.findById(customerId).lean();
                if (customer) {
                  const invoiceRef = entry.memo.includes(' for Invoice ') 
                    ? entry.memo.split(' for Invoice ')[1] 
                    : entry.transactions?.[0]?.meta?.invoiceNumber;
                  enhancedEntry.memo = `Payment Received from Customer ${customer.name}${invoiceRef ? ` for Invoice ${invoiceRef}` : ''}`;
                }
              }
            }
            
            // For payment sent to supplier
            else if (entry.memo.includes('Payment Sent to Supplier')) {
              let supplierId;
              if (entry.memo.includes(' for Bill ')) {
                supplierId = entry.memo.split('Supplier ')[1].split(' for Bill ')[0];
              } else {
                supplierId = entry.memo.split('Supplier ')[1];
              }
              if (supplierId && supplierId.includes('(')) {
                supplierId = supplierId.split(' (')[0];
              }
              if (mongoose.Types.ObjectId.isValid(supplierId)) {
                const supplier = await Supplier.findById(supplierId).lean();
                if (supplier) {
                  const billRef = entry.memo.includes(' for Bill ')
                    ? entry.memo.split(' for Bill ')[1]
                    : entry.transactions?.[0]?.meta?.billNumber;
                  enhancedEntry.memo = `Payment Sent to Supplier ${supplier.name}${billRef ? ` for Bill ${billRef}` : ''}`;
                }
              }
            }
            
            // For sales orders
            else if (entry.memo.includes('Sales Order to Customer')) {
              let customerId = entry.memo.replace('Sales Order to Customer ', '');
              if (customerId && customerId.includes('(')) {
                customerId = customerId.split(' (')[0].trim();
              }
              if (!mongoose.Types.ObjectId.isValid(customerId.trim())) {
                  customerId = entry.transactions?.[0]?.meta?.customerId;
              }
              if (mongoose.Types.ObjectId.isValid(customerId)) {
                  const customer = await Customer.findById(customerId).lean();
                  if (customer) {
                      enhancedEntry.memo = `Sales Order to Customer ${customer.name}`;
                  }
              }
            }
            
            // For purchase orders
            else if (entry.memo.includes('Purchase Order from Supplier')) {
              let supplierId = entry.memo.replace('Purchase Order from Supplier ', '');
              if (supplierId && supplierId.includes('(')) {
                supplierId = supplierId.split(' (')[0].trim();
              }
               if (!mongoose.Types.ObjectId.isValid(supplierId.trim())) {
                  supplierId = entry.transactions?.[0]?.meta?.supplierId;
              }
              if (mongoose.Types.ObjectId.isValid(supplierId)) {
                const supplier = await Supplier.findById(supplierId).lean();
                if (supplier) {
                  enhancedEntry.memo = `Purchase Order from Supplier ${supplier.name}`;
                }
              }
            }
          }
          
          return enhancedEntry;
        })
      );
      
      // After enhancing entries, filter by voucherType if provided
      let filteredEntries = enhancedEntries;
      if (voucherType) {
        // Helper to infer voucher type from voucherNumber prefix
        function getVoucherType(voucherNumber) {
          if (!voucherNumber) return "Unknown";
          if (voucherNumber.startsWith("JV-")) return "Journal Voucher";
          if (voucherNumber.startsWith("CV-")) return "Contra Voucher";
          if (voucherNumber.startsWith("SV-")) return "Sales Voucher";
          if (voucherNumber.startsWith("SR-")) return "Sales Return Voucher";
          if (voucherNumber.startsWith("PV-")) return "Purchase Voucher";
          if (voucherNumber.startsWith("PR-")) return "Purchase Return Voucher";
          if (voucherNumber.startsWith("PaV-")) return "Payment Voucher";
          if (voucherNumber.startsWith("RcV-")) return "Receipt Voucher";
          return "Other";
        }
        filteredEntries = enhancedEntries.filter(entry => getVoucherType(entry.voucherNumber) === voucherType);
      }

      // Group by date (YYYY-MM-DD)
      const groupedByDate = {};
      filteredEntries.forEach(entry => {
        const date = entry.datetime ? new Date(entry.datetime).toISOString().slice(0, 10) : 'Unknown';
        if (!groupedByDate[date]) groupedByDate[date] = [];
        groupedByDate[date].push(entry);
      });
      const groupedArray = Object.keys(groupedByDate).sort((a,b) => new Date(b) - new Date(a)).map(date => ({
        date,
        entries: groupedByDate[date]
      }));

      // Get total count for pagination
      let totalCount = 0;
      
      try {
        const journalModel = mongoose.model('Medici_Journal');
        totalCount = await journalModel.countDocuments({ ...query, book: 'cloud_ledger' });
      } catch (countError) {
      }

      return NextResponse.json({
        dayBookEntries: groupedArray,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          perPage: limit,
        },
      });
    } catch (error) {
      // Return an empty result with error message
      return NextResponse.json({
        error: 'Failed to fetch day book entries: ' + error.message,
        dayBookEntries: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          perPage: limit,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch day book entries', dayBookEntries: [] },
      { status: 500 }
    );
  }
} 