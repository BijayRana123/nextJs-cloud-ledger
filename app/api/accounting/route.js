import { NextResponse } from 'next/server';
import AccountingService from '../../../lib/services/AccountingService';

// Helper function to handle API responses
const handleApiResponse = async (handler) => {
  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
};

// GET - Get account balances or transactions
export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  switch (action) {
    case 'balances':
      return handleApiResponse(async () => {
        return await AccountingService.getAccountBalances();
      });
      
    case 'transactions':
      const accountPath = url.searchParams.get('account');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const skip = parseInt(url.searchParams.get('skip') || '0');
      
      if (!accountPath) {
        return NextResponse.json(
          { error: 'Account path is required' },
          { status: 400 }
        );
      }
      
      return handleApiResponse(async () => {
        return await AccountingService.getAccountTransactions(accountPath, {
          startDate,
          endDate,
          limit,
          skip
        });
      });
      
    case 'statement':
      const entityType = url.searchParams.get('entityType');
      const entityId = url.searchParams.get('entityId');
      
      if (!entityType || !entityId) {
        return NextResponse.json(
          { error: 'Entity type and ID are required' },
          { status: 400 }
        );
      }
      
      return handleApiResponse(async () => {
        return await AccountingService.getEntityStatement(
          entityType, 
          entityId, 
          {
            startDate: url.searchParams.get('startDate'),
            endDate: url.searchParams.get('endDate'),
            limit: parseInt(url.searchParams.get('limit') || '100'),
            skip: parseInt(url.searchParams.get('skip') || '0')
          }
        );
      });
      
    default:
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
  }
}

// POST - Create new accounting entries
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'customer_invoice':
        return handleApiResponse(async () => {
          return await AccountingService.recordCustomerInvoice(body);
        });
        
      case 'customer_payment':
        return handleApiResponse(async () => {
          return await AccountingService.recordCustomerPayment(body);
        });
        
      case 'supplier_bill':
        return handleApiResponse(async () => {
          return await AccountingService.recordSupplierBill(body);
        });
        
      case 'supplier_payment':
        return handleApiResponse(async () => {
          return await AccountingService.recordSupplierPayment(body);
        });
        
      case 'employee_payroll':
        return handleApiResponse(async () => {
          return await AccountingService.recordEmployeePayroll(body);
        });
        
      case 'journal_entry':
        return handleApiResponse(async () => {
          return await AccountingService.recordJournalEntry(body);
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 