"use client";

import RecordOwnerDrawingsForm from '@/app/components/accounting/RecordOwnerDrawingsForm';

export default function RecordOwnerDrawingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Owner Drawings</h1>
      <RecordOwnerDrawingsForm />
    </div>
  );
}
