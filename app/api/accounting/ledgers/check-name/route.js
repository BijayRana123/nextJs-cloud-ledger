import dbConnect from '@/lib/dbConnect';
import { Ledger } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const orgId = request.headers.get('x-organization-id');
    if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Name parameter required' }, { status: 400 });
    }
    
    // Check if ledger name already exists (case-insensitive)
    const existingLedger = await Ledger.findOne({ 
      organization: orgId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    }).populate('group').lean();
    
    if (existingLedger) {
      return NextResponse.json({ 
        exists: true,
        ledger: {
          _id: existingLedger._id,
          name: existingLedger.name,
          group: existingLedger.group ? {
            _id: existingLedger.group._id,
            name: existingLedger.group.name
          } : null
        }
      });
    }
    
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking ledger name:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}