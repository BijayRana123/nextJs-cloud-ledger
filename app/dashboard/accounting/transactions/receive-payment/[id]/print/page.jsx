"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ReceiptVoucherPrintPage() {
  const { id } = useParams();
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

  if (isLoading) return <div className="p-8">Loading receipt voucher...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!voucher) return null;

  // Extract customer and payment method
  const customer = voucher.transactions?.find(t => t.meta?.customerName)?.meta?.customerName || 'N/A';
  const paymentMethod = voucher.transactions?.find(t => t.meta?.paymentMethod)?.meta?.paymentMethod || 'N/A';

  return (
    <div className="p-8 print:p-0 max-w-2xl mx-auto bg-white print:bg-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Receipt Voucher</h1>
        <div className="text-gray-600">Voucher ID: {voucher._id}</div>
      </div>
      <div className="mb-4 flex justify-between">
        <div>
          <div className="text-sm text-gray-500">Date</div>
          <div>{voucher.datetime ? new Date(voucher.datetime).toLocaleDateString() : 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Customer</div>
          <div>{customer}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Payment Method</div>
          <div>{paymentMethod}</div>
        </div>
      </div>
      <div className="mb-4">
        <span className="font-medium">Amount:</span> {voucher.amount || voucher.transactions?.[0]?.amount || 'N/A'}
      </div>
      <div className="mb-4">
        <span className="font-medium">Memo:</span> {voucher.memo || ''}
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Transactions</h3>
        <table className="w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border px-2 py-1">Account</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Type</th>
            </tr>
          </thead>
          <tbody>
            {voucher.transactions?.map((t, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{t.accountName || t.account || 'N/A'}</td>
                <td className="border px-2 py-1">{t.amount}</td>
                <td className="border px-2 py-1">{t.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-12 flex justify-between print:hidden">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Print</button>
        <a href="/dashboard/accounting/transactions/receive-payment" className="text-blue-600 underline">Back to List</a>
      </div>
    </div>
  );
} 