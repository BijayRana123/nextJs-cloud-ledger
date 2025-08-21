"use client";

import { useState, useEffect } from "react";
import ReceivePaymentForm from '@/components/accounting/ReceivePaymentForm';
import ExpertPaymentForm from '@/components/accounting/ExpertPaymentForm';

export default function AddReceiptVoucherPage() {
  const [tab, setTab] = useState('simple');
  const [voucherNumber, setVoucherNumber] = useState("");

  // Fetch next unique receipt voucher number on mount
  useEffect(() => {
    let baseNumber = 0;
    let candidate = '';
    let isUnique = false;
    const fetchNextUniqueReceiptVoucherNumber = async () => {
      try {
        const response = await fetch('/api/accounting/counters/next?type=receipt');
        let nextNumber = 'RcV-0001';
        if (response.ok) {
          const data = await response.json();
          nextNumber = data.nextNumber.startsWith('RcV-') ? data.nextNumber : `RcV-${data.nextNumber}`;
        }
        // Extract numeric part for incrementing
        const match = nextNumber.match(/RcV-(\d+)/);
        baseNumber = match ? parseInt(match[1], 10) : 1;
      } catch (err) {
        baseNumber = 1;
      }
      // Try to find a unique number
      while (!isUnique) {
        candidate = `RcV-${baseNumber.toString().padStart(5, '0')}`;
        // Check uniqueness via backend
        try {
          const checkRes = await fetch(`/api/organization/receipt-vouchers/check-number?number=${candidate}`);
          const checkData = await checkRes.json();
          if (checkRes.ok && checkData.unique) {
            isUnique = true;
          } else {
            baseNumber++;
          }
        } catch (e) {
          // If check fails, assume unique to avoid infinite loop
          isUnique = true;
        }
      }
      setVoucherNumber(candidate);
    };
    fetchNextUniqueReceiptVoucherNumber();
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
