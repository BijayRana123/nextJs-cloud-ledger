"use client";

import PaySupplierForm from '@/app/components/accounting/PaySupplierForm';

export default function PaySupplierPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Payment Sent to Supplier</h1>
      <PaySupplierForm />
    </div>
  );
}
