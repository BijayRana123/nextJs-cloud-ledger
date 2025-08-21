import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PaymentVoucher from '@/lib/models/PaymentVoucher';
import { protect } from '@/lib/middleware/auth';

export async function GET(request) {
  await dbConnect();
  
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }

    // Get organization ID from request headers
    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ unique: false, error: 'No organization context found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    if (!number) {
      return NextResponse.json({ unique: false, error: 'No number provided' }, { status: 400 });
    }
    
    // Check if number exists within the organization
    const exists = await PaymentVoucher.exists({ 
      paymentVoucherNumber: number,
      organization: organizationId
    });
    
    return NextResponse.json({ unique: !exists });
  } catch (error) {
    console.error("Error checking payment voucher number:", error);
    return NextResponse.json({ unique: false, error: error.message }, { status: 500 });
  }
} 
