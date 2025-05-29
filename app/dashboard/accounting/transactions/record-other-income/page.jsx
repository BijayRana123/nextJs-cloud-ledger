"use client";

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from '@/components/ui/CustomTable';
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function IncomeVoucherListPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/accounting/journal-entries?limit=50&searchTerm=^Other%20Income:', fetcher, { refreshInterval: 10000 });
  const vouchers = data?.journalEntries || [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Income Vouchers</h1>
        <Link href="/dashboard/accounting/transactions/record-other-income/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
          <Rocket className="h-5 w-5 mr-2" />
          ADD NEW
        </Link>
      </div>
      {isLoading ? (
        <div>Loading income vouchers...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error.message || 'Failed to fetch income vouchers'}</div>
      ) : (
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead>Date</CustomTableHead>
              <CustomTableHead>Account</CustomTableHead>
              <CustomTableHead>Amount</CustomTableHead>
              <CustomTableHead>Payment Method</CustomTableHead>
              <CustomTableHead>Memo</CustomTableHead>
              <CustomTableHead>Actions</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {vouchers.length === 0 ? (
              <CustomTableRow>
                <CustomTableCell colSpan={6} className="text-center">No income vouchers found.</CustomTableCell>
              </CustomTableRow>
            ) : (
              vouchers.map((voucher) => {
                // Extract account and payment method from transactions/meta
                const account = voucher.transactions?.find(t => t.meta?.incomeAccountName)?.meta?.incomeAccountName || voucher.transactions?.[0]?.accountName || 'N/A';
                const paymentMethod = voucher.transactions?.find(t => t.meta?.paymentMethod)?.meta?.paymentMethod || 'N/A';
                return (
                  <CustomTableRow key={voucher._id}>
                    <CustomTableCell>{voucher.datetime ? new Date(voucher.datetime).toLocaleDateString() : 'N/A'}</CustomTableCell>
                    <CustomTableCell>{account}</CustomTableCell>
                    <CustomTableCell>{voucher.amount || voucher.transactions?.[0]?.amount || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{paymentMethod}</CustomTableCell>
                    <CustomTableCell>{voucher.memo || ''}</CustomTableCell>
                    <CustomTableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/accounting/transactions/record-other-income/${voucher._id}`)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/dashboard/accounting/transactions/record-other-income/${voucher._id}/print`, '_blank')}>Print</Button>
                    </CustomTableCell>
                  </CustomTableRow>
                );
              })
            )}
          </CustomTableBody>
        </CustomTable>
      )}
    </div>
  );
}
