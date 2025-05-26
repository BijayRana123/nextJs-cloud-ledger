import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createSalesReturnEntry } from '@/lib/accounting';

export async function POST(request, context) {
  await dbConnect();

  try {
    // Authenticate the user using the middleware
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    // Get the organization ID from the request object (set by the auth middleware)
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    // Get the sales return voucher ID from the URL params
    const params = await context.params;
    const id = params.id;
    // Find the sales return voucher by ID and organization ID
    const salesReturn = await SalesReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!salesReturn) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }
    // Check if the sales return voucher can be approved (only if it's in DRAFT status)
    if (salesReturn.status !== 'DRAFT') {
      return NextResponse.json({ message: 'Only draft sales return vouchers can be approved' }, { status: 400 });
    }
    // Update the status to APPROVED
    salesReturn.status = 'APPROVED';
    await salesReturn.save();
    // Optionally, create a journal entry (if not already done)
    // await createSalesReturnEntry(salesReturn);
    return NextResponse.json({ message: 'Sales return voucher approved successfully', salesReturn }, { status: 200 });
  } catch (error) {
    console.error('Error approving sales return voucher:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 