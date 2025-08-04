import { NextResponse } from 'next/server';
import TrialBalanceService from '@/lib/services/TrialBalanceService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const asOfDate = searchParams.get('asOfDate') || new Date().toISOString();
    const format = searchParams.get('format') || 'json'; // json or csv
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Generate trial balance
    const trialBalanceData = await TrialBalanceService.generateTrialBalance(
      organizationId, 
      asOfDate
    );

    // Add validation results
    const validation = TrialBalanceService.validateTrialBalance(trialBalanceData);
    trialBalanceData.validation = validation;

    // Return CSV format if requested
    if (format === 'csv') {
      const csvContent = TrialBalanceService.exportToCSV(trialBalanceData);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="trial-balance-${new Date(asOfDate).toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: trialBalanceData
    });

  } catch (error) {
    console.error('Error generating trial balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate trial balance',
        details: error.message 
      },
      { status: 500 }
    );
  }
}