"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ContraVoucherPrintPage() {
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

  if (isLoading) return <div className="p-8">Loading contra voucher...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!voucher) return null;

  return (
    <div className="p-8 print:p-0 max-w-2xl mx-auto bg-white print:bg-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Contra Voucher</h1>
        <div className="text-gray-600">Voucher ID: {voucher._id}</div>
      </div>
      <div className="mb-4 flex justify-between">
        <div>
          <div className="text-sm text-gray-500">Date</div>
          <div>{voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">From Account</div>
          <div>{voucher.fromAccount}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">To Account</div>
          <div>{voucher.toAccount}</div>
        </div>
      </div>
      <div className="mb-4">
        <span className="font-medium">Amount:</span> {voucher.amount}
      </div>
      <div className="mb-4">
        <span className="font-medium">Currency:</span> {voucher.currency}
      </div>
      <div className="mb-4">
        <span className="font-medium">Exchange Rate to NPR:</span> {voucher.exchangeRateToNPR}
      </div>
      <div className="mb-4">
        <span className="font-medium">Notes:</span> {voucher.notes || ''}
      </div>
      <div className="mb-4">
        <span className="font-medium">Status:</span> {voucher.status}
      </div>
      <div className="mb-4">
        <span className="font-medium">Reference No:</span> {voucher.referenceNo}
      </div>
      <div className="mt-12 flex justify-between print:hidden">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Print</button>
        <a href="/dashboard/accounting/transactions/contra-voucher" className="text-blue-600 underline">Back to List</a>
      </div>
    </div>
  );
} 