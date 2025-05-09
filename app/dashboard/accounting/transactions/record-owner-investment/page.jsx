"use client";

import RecordOwnerInvestmentForm from '@/app/components/accounting/RecordOwnerInvestmentForm';

export default function RecordOwnerInvestmentPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Owner Investment</h1>
      <RecordOwnerInvestmentForm />
    </div>
  );
}
