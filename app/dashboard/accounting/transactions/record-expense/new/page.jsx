"use client";

import RecordExpenseForm from '@/app/components/accounting/RecordExpenseForm';
import { useRouter } from 'next/navigation';

export default function AddExpenseVoucherPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/accounting/transactions/record-expense');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Expense</h1>
      <RecordExpenseForm onSuccess={handleSuccess} />
    </div>
  );
} 
