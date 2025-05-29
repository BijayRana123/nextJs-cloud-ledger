"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ContraVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchVoucher = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/vouchers/contra`);
        const result = await response.json();
        if (response.ok && result.contraVouchers) {
          const found = result.contraVouchers.find(v => v._id === id);
          if (found) {
            setVoucher(found);
          } else {
            setError('Contra voucher not found');
          }
        } else {
          setError(result.message || 'Failed to fetch contra voucher');
        }
      } catch (err) {
        setError('An error occurred while fetching contra voucher.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  if (isLoading) return <div className="p-4">Loading contra voucher...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!voucher) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Contra Voucher Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div>{voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}</div>
            </div>
            <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}/print`)}>Print</Button>
          </div>
          <div className="mb-2">
            <span className="font-medium">From Account:</span> {voucher.fromAccount}
          </div>
          <div className="mb-2">
            <span className="font-medium">To Account:</span> {voucher.toAccount}
          </div>
          <div className="mb-2">
            <span className="font-medium">Amount:</span> {voucher.amount}
          </div>
          <div className="mb-2">
            <span className="font-medium">Currency:</span> {voucher.currency}
          </div>
          <div className="mb-2">
            <span className="font-medium">Exchange Rate to NPR:</span> {voucher.exchangeRateToNPR}
          </div>
          <div className="mb-2">
            <span className="font-medium">Notes:</span> {voucher.notes || ''}
          </div>
          <div className="mb-2">
            <span className="font-medium">Status:</span> {voucher.status}
          </div>
          <div className="mb-2">
            <span className="font-medium">Reference No:</span> {voucher.referenceNo}
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/dashboard/accounting/transactions/contra-voucher">
          <Button variant="secondary">Back to List</Button>
        </Link>
      </div>
    </div>
  );
} 