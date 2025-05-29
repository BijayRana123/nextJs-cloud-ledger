"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ReceiptVoucherDetailPage() {
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
        const response = await fetch(`/api/accounting/journal-entries?_id=${id}`);
        const result = await response.json();
        if (response.ok && result.journalEntries && result.journalEntries.length > 0) {
          setVoucher(result.journalEntries[0]);
        } else {
          setError('Receipt voucher not found');
        }
      } catch (err) {
        setError('An error occurred while fetching receipt voucher.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  if (isLoading) return <div className="p-4">Loading receipt voucher...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!voucher) return null;

  // Extract customer and payment method
  const customer = voucher.transactions?.find(t => t.meta?.customerName)?.meta?.customerName || 'N/A';
  const paymentMethod = voucher.transactions?.find(t => t.meta?.paymentMethod)?.meta?.paymentMethod || 'N/A';

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Voucher Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div>{voucher.datetime ? new Date(voucher.datetime).toLocaleDateString() : 'N/A'}</div>
            </div>
            <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/receive-payment/${id}/print`)}>Print</Button>
          </div>
          <div className="mb-2">
            <span className="font-medium">Customer:</span> {customer}
          </div>
          <div className="mb-2">
            <span className="font-medium">Amount:</span> {voucher.amount || voucher.transactions?.[0]?.amount || 'N/A'}
          </div>
          <div className="mb-2">
            <span className="font-medium">Payment Method:</span> {paymentMethod}
          </div>
          <div className="mb-2">
            <span className="font-medium">Memo:</span> {voucher.memo || ''}
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Transactions</h3>
            <ul className="list-disc pl-6">
              {voucher.transactions?.map((t, idx) => (
                <li key={idx}>
                  <span className="font-medium">Account:</span> {t.accountName || t.account || 'N/A'} | <span className="font-medium">Amount:</span> {t.amount} | <span className="font-medium">Type:</span> {t.type}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/dashboard/accounting/transactions/receive-payment">
          <Button variant="secondary">Back to List</Button>
        </Link>
      </div>
    </div>
  );
} 