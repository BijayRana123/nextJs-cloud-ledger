"use client";

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from '@/components/ui/CustomTable';
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ContraVoucherListPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/accounting/vouchers/contra', fetcher, { refreshInterval: 10000 });
  const vouchers = data?.contraVouchers || [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contra Vouchers</h1>
        <Link href="/dashboard/accounting/transactions/contra-voucher/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-yellow-500 text-primary-foreground shadow hover:bg-yellow-600 h-9 px-4 py-2">
          <Rocket className="h-5 w-5 mr-2" />
          ADD NEW
        </Link>
      </div>
      {isLoading ? (
        <div>Loading contra vouchers...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error.message || 'Failed to fetch contra vouchers'}</div>
      ) : (
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead>Date</CustomTableHead>
              <CustomTableHead>From Account</CustomTableHead>
              <CustomTableHead>To Account</CustomTableHead>
              <CustomTableHead>Amount</CustomTableHead>
              <CustomTableHead>Status</CustomTableHead>
              <CustomTableHead>Actions</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {vouchers.length === 0 ? (
              <CustomTableRow>
                <CustomTableCell colSpan={6} className="text-center">No contra vouchers found.</CustomTableCell>
              </CustomTableRow>
            ) : (
              vouchers.map((voucher) => (
                <CustomTableRow key={voucher._id}>
                  <CustomTableCell>{voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}</CustomTableCell>
                  <CustomTableCell>{voucher.fromAccount}</CustomTableCell>
                  <CustomTableCell>{voucher.toAccount}</CustomTableCell>
                  <CustomTableCell>{voucher.amount}</CustomTableCell>
                  <CustomTableCell>{voucher.status}</CustomTableCell>
                  <CustomTableCell>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${voucher._id}`)}>View</Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`/dashboard/accounting/transactions/contra-voucher/${voucher._id}/print`, '_blank')}>Print</Button>
                  </CustomTableCell>
                </CustomTableRow>
              ))
            )}
          </CustomTableBody>
        </CustomTable>
      )}
    </div>
  );
} 