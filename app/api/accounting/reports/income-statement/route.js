import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import ProfitLossService from '@/lib/services/ProfitLossService';

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

    // Get organization ID from headers (preferred) or body (fallback)
    const orgIdFromHeader = request.headers.get('x-organization-id');
    
    // Parse request body to get parameters
    const body = await request.json();
    const { 
      startDate, 
      endDate, 
      organizationId: orgIdFromBody,
      format = 'json',
      includeComparison = false,
      previousStartDate,
      previousEndDate
    } = body;

    // Use header organization ID if available, otherwise use body
    const organizationId = orgIdFromHeader || orgIdFromBody;

    // Validate required parameters
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Generate the profit & loss statement
    let profitLossData;
    
    if (includeComparison && previousStartDate && previousEndDate) {
      // Generate comparison report
      profitLossData = await ProfitLossService.comparePeriods(
        organizationId,
        new Date(startDate),
        new Date(endDate),
        new Date(previousStartDate),
        new Date(previousEndDate)
      );
    } else {
      // Generate single period report
      profitLossData = await ProfitLossService.generateProfitLossStatement(
        organizationId,
        new Date(startDate),
        new Date(endDate)
      );
    }

    // Add validation results
    const validation = ProfitLossService.validateProfitLossStatement(
      includeComparison ? profitLossData.currentPeriod : profitLossData
    );
    
    if (includeComparison) {
      profitLossData.validation = validation;
    } else {
      profitLossData.validation = validation;
    }

    // Return CSV format if requested
    if (format === 'csv') {
      const csvContent = ProfitLossService.exportToCSV(
        includeComparison ? profitLossData.currentPeriod : profitLossData
      );
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="profit-loss-statement-${new Date(startDate).toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: profitLossData
    });

  } catch (error) {
    console.error("Error generating profit & loss statement:", error);
    return NextResponse.json(
      { error: 'Failed to generate profit & loss statement', details: error.message },
      { status: 500 }
    );
  }
} 
