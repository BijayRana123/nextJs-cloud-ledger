import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { JournalVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createJournalEntry } from '@/lib/accounting';
import Counter from '@/lib/models/Counter';

// Handler for POST requests - creating new journal vouchers
export async function POST(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.memo || !data.transactions || !Array.isArray(data.transactions) || data.transactions.length === 0) {
      return NextResponse.json({ message: 'Memo and at least one transaction are required.' }, { status: 400 });
    }

    // Validate transactions
    for (const txn of data.transactions) {
      if (!txn.account || !txn.type || !txn.amount || txn.amount <= 0) {
        return NextResponse.json({ message: 'Each transaction must have an account, type (debit/credit), and positive amount' }, { status: 400 });
      }
    }

    // Calculate totals
    const totalDebits = data.transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalCredits = data.transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Check if debits equal credits (allowing for small rounding differences)
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json({ message: 'Total debits must equal total credits' }, { status: 400 });
    }

    // Fetch organization name using organizationId
    const Organization = (await import('@/lib/models/Organization')).default;
    const orgDoc = await Organization.findById(organizationId);
    if (!orgDoc) {
      return NextResponse.json({ message: 'Organization not found.' }, { status: 400 });
    }
    const organizationName = orgDoc.name;

    // Generate reference number if not provided, with retry for uniqueness
    if (!data.referenceNo) {
      const maxRetries = 5;
      let retryCount = 0;
      let uniqueReferenceNo = null;
      while (retryCount < maxRetries && !uniqueReferenceNo) {
        const counter = await Counter.findOneAndUpdate(
          { name: 'journal_voucher', organization: organizationName },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        if (!counter) {
          throw new Error('Failed to generate journal voucher counter');
        }
        const candidateRef = `JV-${counter.value.toString().padStart(4, '0')}`;
        const exists = await JournalVoucher.findOne({ referenceNo: candidateRef });
        if (!exists) {
          uniqueReferenceNo = candidateRef;
        } else {
          retryCount++;
        }
      }
      if (!uniqueReferenceNo) {
        return NextResponse.json({ message: 'Failed to generate unique reference number after multiple retries.' }, { status: 500 });
      }
      data.referenceNo = uniqueReferenceNo;
    }

    const journalVoucher = new JournalVoucher({
      ...data,
      organization: organizationId,
      date: data.date || new Date()
    });

    await journalVoucher.save();
    // Create Medici journal and transactions for this voucher
    await createJournalEntry(journalVoucher, organizationId, organizationName);
    return NextResponse.json({ message: 'Journal voucher created', _id: journalVoucher._id, journalVoucher }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create journal voucher', error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  await dbConnect();
  try {
    const authResult = await protect(request);
    if (authResult && authResult.status !== 200) {
      return authResult;
    }
    const organizationId = request.organizationId;
    if (!organizationId) {
      return NextResponse.json({ message: 'No organization context found. Please select an organization.' }, { status: 400 });
    }

    const vouchers = await JournalVoucher.find({ organization: organizationId })
      .lean()
      .sort({ date: -1 });

    return NextResponse.json({ journalVouchers: vouchers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch journal vouchers', error: error.message }, { status: 500 });
  }
} 