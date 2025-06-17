"use client";

import { useState, useEffect } from "react";
import ReceivePaymentForm from '@/app/components/accounting/ReceivePaymentForm';
import ExpertPaymentForm from '@/components/accounting/ExpertPaymentForm';

export default function AddReceiptVoucherPage() {
  const [tab, setTab] = useState('simple');
  const [voucherNumber, setVoucherNumber] = useState("");

  // Fetch next available receipt voucher number on mount (peek, do not increment)
  useEffect(() => {
    const fetchNextReceiptVoucherNumber = async () => {
      try {
        const response = await fetch('/api/accounting/counters/next?type=receipt');
        let nextNumber = 'RcV-0001';
        if (response.ok) {
          const data = await response.json();
          nextNumber = data.nextNumber || nextNumber;
        }
        setVoucherNumber(nextNumber);
      } catch (err) {
        setVoucherNumber('RcV-0001');
      }
    };
    fetchNextReceiptVoucherNumber();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Payment Received</h1>
      <div className="mb-6 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${tab === 'simple' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('simple')}
        >
          Simple
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === 'expert' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('expert')}
        >
          Expert (Journal Entry Style)
        </button>
      </div>
      {tab === 'simple' ? (
        <ReceivePaymentForm voucherNumber={voucherNumber} setVoucherNumber={setVoucherNumber} />
      ) : (
        <ExpertPaymentForm mode="receive-payment" voucherNumber={voucherNumber} setVoucherNumber={setVoucherNumber} />
      )}
    </div>
  );
} 