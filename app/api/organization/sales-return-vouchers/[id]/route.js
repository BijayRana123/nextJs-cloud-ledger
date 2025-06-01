import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { SalesReturnVoucher } from '@/lib/models';
import { protect } from '@/lib/middleware/auth';

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
    const params = await context.params;
    const id = params.id;
    const salesReturnVoucher = await SalesReturnVoucher.findOne({
      _id: id,
      organization: organizationId
    }).populate('customer').populate('items.item').lean();

    if (!salesReturnVoucher) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }

    return NextResponse.json({ salesReturnVoucher }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sales return voucher:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
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
    const deleted = await SalesReturnVoucher.findOneAndDelete({
      _id: id,
      organization: organizationId
    });
    if (!deleted) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Sales return voucher deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sales return voucher:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
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
    const params = await context.params;
    const id = params.id;
    const { status, ...updateData } = await request.json();

    const voucher = await SalesReturnVoucher.findOne({ _id: id, organization: organizationId });
    if (!voucher) {
      return NextResponse.json({ message: 'Sales return voucher not found' }, { status: 404 });
    }

    Object.assign(voucher, updateData);

    if (status !== undefined) {
      voucher.status = status;
    }

    await voucher.save();
    return NextResponse.json({ message: 'Sales return voucher updated successfully', salesReturnVoucher: voucher }, { status: 200 });
  } catch (error) {
    console.error("Error updating sales return voucher:", error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
} 