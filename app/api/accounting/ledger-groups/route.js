import dbConnect from '@/lib/dbConnect';
import { LedgerGroup } from '@/lib/models';
import { NextResponse } from 'next/server';

const DEFAULT_GROUPS = [
  'Capital Account', 'Current Assets', 'Current Liabilities', 'Fixed Assets', 'Investments',
  'Loans (Liability)', 'Misc. Expenses (Asset)', 'Suspense Account', 'Branch/Divisions',
  'Reserves & Surplus', 'Secured Loans', 'Unsecured Loans', 'Bank Accounts', 'Cash-in-Hand',
  'Deposits (Asset)', 'Duties & Taxes', 'Provisions', 'Accounts Payable', 'Accounts Receivable',
  'Sales Account', 'Purchase Account', 'Direct Expenses', 'Indirect Expenses',
  'Direct Incomes', 'Indirect Incomes'
];

export async function GET(request) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  let groups = await LedgerGroup.find({ organization: orgId }).lean();
  if (groups.length === 0) {
    // Seed defaults
    await LedgerGroup.insertMany(DEFAULT_GROUPS.map(name => ({ name, organization: orgId })));
    groups = await LedgerGroup.find({ organization: orgId }).lean();
  }
  return NextResponse.json({ groups });
}

export async function POST(request) {
  await dbConnect();
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const exists = await LedgerGroup.findOne({ name: body.name, organization: orgId });
  if (exists) return NextResponse.json({ error: 'Group already exists' }, { status: 409 });
  const group = await LedgerGroup.create({
    name: body.name,
    parent: body.parent || null,
    description: body.description || '',
    organization: orgId,
  });
  return NextResponse.json({ group });
} 
