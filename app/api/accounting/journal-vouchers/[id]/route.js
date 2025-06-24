import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { JournalVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';
import { createJournalEntry } from '@/lib/accounting';

export async function GET(request, context) {
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

    const params = context.params;
    const id = params.id;

    const journalVoucher = await JournalVoucher.findOne({
      _id: id,
      organization: organizationId
    }).lean();

    if (!journalVoucher) {
      return NextResponse.json({ message: 'Journal voucher not found' }, { status: 404 });
    }

    return NextResponse.json(journalVoucher);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch journal voucher', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
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

    const params = context.params;
    const id = params.id;
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

    // Check if debits equal credits
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json({ message: 'Total debits must equal total credits' }, { status: 400 });
    }

    const journalVoucher = await JournalVoucher.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { ...data },
      { new: true }
    );

    if (!journalVoucher) {
      return NextResponse.json({ message: 'Journal voucher not found' }, { status: 404 });
    }

    // Remove status logic for APPROVED
    // If you want to always create journal entry, uncomment below:
    // await createJournalEntry(journalVoucher);

    return NextResponse.json({ message: 'Journal voucher updated', journalVoucher });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update journal voucher', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
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

    const params = context.params;
    const id = params.id;

    const journalVoucher = await JournalVoucher.findOneAndDelete({
      _id: id,
      organization: organizationId
    });

    if (!journalVoucher) {
      return NextResponse.json({ message: 'Journal voucher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Journal voucher deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete journal voucher', error: error.message }, { status: 500 });
  }
} 