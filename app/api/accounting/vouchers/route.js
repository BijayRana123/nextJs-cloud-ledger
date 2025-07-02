import { NextResponse } from 'next/server';
import { 
  connectToDatabase, 
  createPaymentSentEntry,
  createPaymentReceivedEntry,
  createExpenseEntry,
  createOtherIncomeEntry,
  createOwnerInvestmentEntry,
  createOwnerDrawingsEntry,
  getJournalEntries 
} from '@/lib/accounting';

// Handler for POST requests - creating new vouchers
export async function POST(request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse request body
    const data = await request.json();
    const { type, ...voucherData } = data;

    if (!type) {
      return NextResponse.json(
        { error: 'Voucher type is required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!voucherData.amount || isNaN(Number(voucherData.amount)) || Number(voucherData.amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Ensure amount is a number
    voucherData.amount = Number(voucherData.amount);

    // Create appropriate journal voucher based on voucher type
    let result;
    try {
      switch (type) {
        case 'payment':
          // Validate payment data
          if (!voucherData.supplierId || !voucherData.paymentMethod) {
            return NextResponse.json(
              { error: 'Supplier ID and payment method are required for payment vouchers' },
              { status: 400 }
            );
          }
          result = await createPaymentSentEntry(voucherData, voucherData.organizationId || request.organizationId);
          break;

        case 'receipt':
          // Validate receipt data
          if (!voucherData.customerId || !voucherData.paymentMethod) {
            return NextResponse.json(
              { error: 'Customer ID and payment method are required for receipt vouchers' },
              { status: 400 }
            );
          }
          result = await createPaymentReceivedEntry(voucherData, voucherData.organizationId || request.organizationId);
          break;

        case 'expense':
          // Validate expense data
          if (!voucherData.expenseType || !voucherData.description || !voucherData.paymentMethod) {
            return NextResponse.json(
              { error: 'Expense type, description, and payment method are required for expense vouchers' },
              { status: 400 }
            );
          }
          result = await createExpenseEntry(voucherData, voucherData.organizationId || request.organizationId);
          break;

        case 'income':
          // Validate income data
          if (!voucherData.incomeType || !voucherData.description || !voucherData.receiptMethod) {
            return NextResponse.json(
              { error: 'Income type, description, and receipt method are required for income vouchers' },
              { status: 400 }
            );
          }
          result = await createOtherIncomeEntry(voucherData, voucherData.organizationId || request.organizationId);
          break;

        case 'owner-investment':
          // Validate owner investment data
          if (!voucherData.method) {
            return NextResponse.json(
              { error: 'Investment method is required for owner investment vouchers' },
              { status: 400 }
            );
          }
          result = await createOwnerInvestmentEntry(voucherData);
          break;

        case 'owner-drawings':
          // Validate owner drawings data
          if (!voucherData.method) {
            return NextResponse.json(
              { error: 'Withdrawal method is required for owner drawings vouchers' },
              { status: 400 }
            );
          }
          result = await createOwnerDrawingsEntry(voucherData);
          break;

        default:
          return NextResponse.json(
            { error: `Unsupported voucher type: ${type}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        message: `${type} voucher created successfully`,
        journalEntry: result,
      });
    } catch (error) {
      console.error(`Error creating ${type} voucher:`, error);
      return NextResponse.json(
        { error: `Failed to create ${type} voucher: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing voucher request:', error);
    return NextResponse.json(
      { error: 'Failed to process voucher request' },
      { status: 500 }
    );
  }
}

// Handler for GET requests - retrieving vouchers
export async function GET(request) {
  try {
    // Get search parameters from the request
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query object for filtering journal entries
    const query = {};
    
    // Add date range filters if provided
    if (startDate && endDate) {
      query.datetime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.datetime = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.datetime = { $lte: new Date(endDate) };
    }

    // Add type-specific filter if provided
    if (type) {
      // Filter by meta data or memo depending on voucher type
      switch (type) {
        case 'payment':
          query['transactions.meta.supplierId'] = { $exists: true };
          break;
        case 'receipt':
          query['transactions.meta.customerId'] = { $exists: true };
          break;
        case 'expense':
          query['transactions.meta.expenseId'] = { $exists: true };
          break;
        case 'income':
          query['transactions.meta.incomeId'] = { $exists: true };
          break;
        case 'owner-investment':
          query['transactions.meta.investmentId'] = { $exists: true };
          break;
        case 'owner-drawings':
          query['transactions.meta.drawingsId'] = { $exists: true };
          break;
      }
    }

    // Options for pagination
    const organizationId = request.organizationId;
    const options = {
      page,
      perPage: limit,
      organizationId,
    };

    // Get journal entries
    const journalEntries = await getJournalEntries(query, options);

    return NextResponse.json({
      vouchers: journalEntries,
      pagination: {
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
} 