import AccountingService from '@/lib/services/AccountingService';

export async function GET() {
  try {
    // Get all account balances
    const balances = await AccountingService.getAccountBalances();
    
    return Response.json({
      success: true,
      balances
    });
  } catch (error) {
    console.error('Error getting account balances:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 