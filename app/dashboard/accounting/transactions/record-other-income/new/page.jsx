"use client";

import RecordOtherIncomeForm from '@/app/components/accounting/RecordOtherIncomeForm';
import { useRouter } from 'next/navigation';

export default function AddIncomeVoucherPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/accounting/transactions/record-other-income');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Other Income</h1>
      <RecordOtherIncomeForm onSuccess={handleSuccess} />
    </div>
  );
} 