import AccountingService from '@/lib/services/AccountingService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { accountPath, startDate, endDate, limit, skip } = body;
    
    if (!accountPath) {
      return Response.json({
        success: false,
        error: 'Account path is required'
      }, { status: 400 });
    }
    
    // Get transactions for the account
    const transactions = await AccountingService.getAccountTransactions(
      accountPath,
      { startDate, endDate, limit, skip }
    );
    
    return Response.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error getting account transactions:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 
