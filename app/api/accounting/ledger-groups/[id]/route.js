import dbConnect from '@/lib/dbConnect';
import { LedgerGroup } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const group = await LedgerGroup.findOne({ _id: params.id, organization: orgId }).lean();
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ group });
}

export async function PUT(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const body = await request.json();
  const group = await LedgerGroup.findOneAndUpdate(
    { _id: params.id, organization: orgId },
    { $set: { name: body.name, parent: body.parent || null, description: body.description || '' } },
    { new: true }
  );
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ group });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const group = await LedgerGroup.findOneAndDelete({ _id: params.id, organization: orgId });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
} 