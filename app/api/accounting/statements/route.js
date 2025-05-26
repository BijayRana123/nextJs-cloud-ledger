import AccountingService from '@/lib/services/AccountingService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { entityType, entityId, startDate, endDate } = body;
    
    if (!entityType || !entityId) {
      return Response.json({
        success: false,
        error: 'Entity type and ID are required'
      }, { status: 400 });
    }
    
    // Get entity statement
    const statement = await AccountingService.getEntityStatement(
      entityType, 
      entityId,
      { startDate, endDate }
    );
    
    return Response.json({
      success: true,
      statement
    });
  } catch (error) {
    console.error('Error getting entity statement:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 