import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ContraVoucher, Organization } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createContraEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';

export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    const data = await request.json();
    if (!data.fromAccount || !data.toAccount || !data.amount || !data.date) {
      return NextResponse.json({ message: 'fromAccount, toAccount, amount, and date are required.' }, { status: 400 });
    }
    // Fetch organization name using organizationId
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;

    // Generate auto-incrementing referenceNo using organizationName for the counter, with retry on duplicate
    if (!data.referenceNo) {
      const maxRetries = 5;
      let retryCount = 0;
      let uniqueReferenceNo = null;
      while (retryCount < maxRetries && !uniqueReferenceNo) {
        const counter = await Counter.findOneAndUpdate(
          { name: 'contra_voucher', organization: organizationName },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        if (!counter) {
          throw new Error('Failed to generate contra voucher counter');
        }
        const candidate = `CV-${counter.value.toString().padStart(4, '0')}`;
        // Check for existing voucher with this referenceNo
        const exists = await ContraVoucher.findOne({ referenceNo: candidate });
        if (!exists) {
          uniqueReferenceNo = candidate;
        } else {
          retryCount++;
        }
      }
      if (!uniqueReferenceNo) {
        throw new Error('Failed to generate unique reference number after multiple retries.');
      }
      data.referenceNo = uniqueReferenceNo;
    }

    const contraVoucher = new ContraVoucher({
      ...data,
      organization: organizationId
    });
    await contraVoucher.save();
    // Always create journal voucher after saving
    await createContraEntry(contraVoucher, organizationId, organizationName);
    return NextResponse.json({ message: 'Contra voucher created', _id: contraVoucher._id, contraVoucher }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create contra voucher', error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.headers.get('x-organization-id') || request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }
    const vouchers = await ContraVoucher.find({ organization: organizationId }).lean().sort({ date: -1 });
    return NextResponse.json({ contraVouchers: vouchers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch contra vouchers', error: error.message }, { status: 500 });
  }
} 
