"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionsPage() {
  const router = useRouter();

  // Transaction types with descriptions
  const transactionTypes = [
    {
      title: "Record Expense",
      description: "Record business expenses like rent, utilities, and supplies",
      path: "/dashboard/accounting/transactions/record-expense",
      color: "bg-orange-50 hover:bg-orange-100",
      textColor: "text-orange-700",
      icon: "💼"
    },
    {
      title: "Pay Supplier",
      description: "Record payments to suppliers and vendors",
      path: "/dashboard/accounting/transactions/pay-supplier",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      icon: "💸"
    },
    {
      title: "Receive Payment",
      description: "Record payments received from customers",
      path: "/dashboard/accounting/transactions/receive-payment",
      color: "bg-green-50 hover:bg-green-100",
      textColor: "text-green-700",
      icon: "💰"
    },
    {
      title: "Record Other Income",
      description: "Record miscellaneous income sources",
      path: "/dashboard/accounting/transactions/record-other-income",
      color: "bg-emerald-50 hover:bg-emerald-100",
      textColor: "text-emerald-700",
      icon: "📈"
    },
    {
      title: "Owner Investment",
      description: "Record owner's contributions to the business",
      path: "/dashboard/accounting/transactions/record-owner-investment",
      color: "bg-purple-50 hover:bg-purple-100",
      textColor: "text-purple-700",
      icon: "🏦"
    },
    {
      title: "Owner Drawings",
      description: "Record owner's withdrawals from the business",
      path: "/dashboard/accounting/transactions/record-owner-drawings",
      color: "bg-red-50 hover:bg-red-100",
      textColor: "text-red-700",
      icon: "🧾"
    },
    {
      title: "Contra Voucher",
      description: "Record transfers between asset accounts",
      path: "/dashboard/accounting/transactions/contra-voucher",
      color: "bg-yellow-50 hover:bg-yellow-100",
      textColor: "text-yellow-700",
      icon: "🔄"
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounting Transactions</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting")}
        >
          Back to Accounting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactionTypes.map((transaction, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-colors ${transaction.color}`}
            onClick={() => router.push(transaction.path)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={transaction.textColor}>{transaction.title}</CardTitle>
                <span className="text-3xl">{transaction.icon}</span>
              </div>
              <CardDescription>{transaction.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" className={transaction.textColor}>
                Create Transaction →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>View Transaction Records</CardTitle>
            <CardDescription>View and manage existing transaction entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => router.push("/dashboard/accounting/reports/day-book")}>View Day Book</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/accounting/reports")}>
                View Financial Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Double-Entry Accounting</CardTitle>
            <CardDescription className="text-blue-700">
              All transactions follow double-entry accounting principles, ensuring accurate financial records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Each transaction affects at least two accounts - one debit and one credit. This maintains the accounting equation: Assets = Liabilities + Equity.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium mb-2">Debits Increase:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Assets (e.g., cash, inventory)</li>
                  <li>Expenses (e.g., rent, utilities)</li>
                  <li>Drawings (owner withdrawals)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium mb-2">Credits Increase:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Liabilities (e.g., loans, accounts payable)</li>
                  <li>Equity (owner investment)</li>
                  <li>Income (e.g., sales, interest income)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
