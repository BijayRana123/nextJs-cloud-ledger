"use client";

import LedgerFilter from "@/app/components/accounting/LedgerFilter";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LedgerPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transaction Ledger</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting")}
        >
          Back to Accounting
        </Button>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          This ledger provides a filtered view of all your transactions. Use the tabs to filter by different categories such as customers, suppliers, assets, cash, income, and expenses.
        </p>
        
        <LedgerFilter />
      </div>
    </div>
  );
} 