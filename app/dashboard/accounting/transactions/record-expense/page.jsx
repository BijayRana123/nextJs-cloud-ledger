"use client";

import RecordExpenseForm from '@/app/components/accounting/RecordExpenseForm';

export default function RecordExpensePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Record Expense</h1>
      <RecordExpenseForm />
    </div>
  );
}
