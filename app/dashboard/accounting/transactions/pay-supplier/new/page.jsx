"use client";

import { useState, useEffect } from "react";
import PaySupplierForm from '@/components/accounting/PaySupplierForm';
import ExpertPaymentForm from '@/components/accounting/ExpertPaymentForm';

export default function AddPaymentVoucherPage() {
  const [tab, setTab] = useState('simple');
  const [voucherNumber, setVoucherNumber] = useState("");

  // Fetch next unique payment voucher number on mount
  useEffect(() => {
    let baseNumber = 0;
    let candidate = '';
    let isUnique = false;
    const fetchNextUniquePaymentVoucherNumber = async () => {
      try {
        const response = await fetch('/api/accounting/counters/next?type=bill');
        let nextNumber = 'PaV-0001';
        if (response.ok) {
          const data = await response.json();
          nextNumber = data.nextNumber.startsWith('PaV-') ? data.nextNumber : `PaV-${data.nextNumber}`;
        }
        // Extract numeric part for incrementing
        const match = nextNumber.match(/PaV-(\d+)/);
        baseNumber = match ? parseInt(match[1], 10) : 1;
      } catch (err) {
        baseNumber = 1;
      }
      // Try to find a unique number
      while (!isUnique) {
        candidate = `PaV-${baseNumber.toString().padStart(4, '0')}`;
        // Check uniqueness via backend
        try {
          const checkRes = await fetch(`/api/organization/payment-vouchers/check-number?number=${candidate}`);
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
    fetchNextUniquePaymentVoucherNumber();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Payment Sent to Supplier</h1>
    
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
        <PaySupplierForm voucherNumber={voucherNumber} setVoucherNumber={setVoucherNumber} />
      ) : (
        <ExpertPaymentForm mode="pay-supplier" voucherNumber={voucherNumber} setVoucherNumber={setVoucherNumber} />
      )}
    </div>
  );
} 
