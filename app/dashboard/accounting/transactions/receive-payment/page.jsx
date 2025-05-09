"use client";

import ReceivePaymentForm from '@/app/components/accounting/ReceivePaymentForm';

export default function ReceivePaymentPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Payment Received</h1>
      <ReceivePaymentForm />
    </div>
  );
}
