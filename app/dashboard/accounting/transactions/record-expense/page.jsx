"use client";

import RecordExpenseForm from '@/app/components/accounting/RecordExpenseForm';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function RecordExpensePage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Record Expense</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/accounting/journal-entries")}
          >
            View Journal Entries
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/accounting/transactions")}
          >
            Back to Transactions
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <RecordExpenseForm />
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Double Entry Journal Impact</h3>
          <p className="text-blue-700 mb-2">When you record an expense, the following accounts are affected:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="font-semibold">Debit</p>
              <p>Expense Account (Selected Expense Type)</p>
              <p className="text-sm text-gray-500">Increases the expense</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="font-semibold">Credit</p>
              <p>Assets (Cash/Bank) or Liabilities (Accounts Payable)</p>
              <p className="text-sm text-gray-500">Decreases assets or increases liabilities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
