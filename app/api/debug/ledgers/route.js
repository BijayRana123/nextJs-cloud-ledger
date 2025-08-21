import dbConnect from '@/lib/dbConnect';
import { Ledger } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    
    // Get all ledgers for this organization (no filtering)
    const allLedgers = await Ledger.find({ organization: orgId }).populate('group').lean();
    
    // Return raw data for debugging
    return NextResponse.json({ 
      count: allLedgers.length,
      ledgers: allLedgers.map(ledger => ({
        _id: ledger._id,
        name: ledger.name,
        code: ledger.code,
        group: ledger.group ? {
          _id: ledger.group._id,
          name: ledger.group.name
        } : null,
        description: ledger.description
      }))
    });
  } catch (error) {
    console.error('Error in debug ledgers GET:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}