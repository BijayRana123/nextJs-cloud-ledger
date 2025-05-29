"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PaymentVoucherDetailPage() {
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
        const response = await fetch(`/api/accounting/vouchers/payment?_id=${id}`);
        const result = await response.json();
        if (response.ok && result.paymentVouchers && result.paymentVouchers.length > 0) {
          setVoucher(result.paymentVouchers[0]);
        } else {
          setError('Payment voucher not found');
        }
      } catch (err) {
        setError('An error occurred while fetching payment voucher.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  if (isLoading) return <div className="p-4">Loading payment voucher...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!voucher) return null;

  // Extract supplier and payment method
  const supplier = voucher.transactions?.find(t => t.meta?.supplierName)?.meta?.supplierName || 'N/A';
  const paymentMethod = voucher.transactions?.find(t => t.meta?.paymentMethod)?.meta?.paymentMethod || 'N/A';

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Payment Voucher Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div>{voucher.datetime ? new Date(voucher.datetime).toLocaleDateString() : 'N/A'}</div>
            </div>
            <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/pay-supplier/${id}/print`)}>Print</Button>
          </div>
          <div className="mb-2">
            <span className="font-medium">Supplier:</span> {supplier}
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
        <Link href="/dashboard/accounting/transactions/pay-supplier">
          <Button variant="secondary">Back to List</Button>
        </Link>
      </div>
    </div>
  );
} 