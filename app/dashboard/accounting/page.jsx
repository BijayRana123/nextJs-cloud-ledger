"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function AccountingPage() {
  const router = useRouter();

  // Main accounting sections
  const sections = [
    {
      title: "Transactions",
      description: "Record business transactions with detailed forms",
      path: "/dashboard/accounting/transactions",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      icon: "📝"
    },
    {
      title: "Vouchers",
      description: "Create accounting vouchers for double-entry accounting",
      path: "/dashboard/accounting/vouchers",
      color: "bg-green-50 hover:bg-green-100",
      textColor: "text-green-700",
      icon: "📊"
    },
    {
      title: "Journal Entries",
      description: "View and manage all journal entries",
      path: "/dashboard/accounting/journal-entries",
      color: "bg-amber-50 hover:bg-amber-100",
      textColor: "text-amber-700",
      icon: "📓"
    },
    // {
    //   title: "Ledger",
    //   description: "View and manage all transactions",
    //   path: "/dashboard/accounting/ledger",
    //   color: "bg-purple-50 hover:bg-purple-100",
    //   textColor: "text-purple-700",
    //   icon: "📅"
    // }
  ];

  // Financial reports
  const reports = [
    {
      title: "General Ledger",
      description: "View the complete record of all transactions",
      path: "/dashboard/accounting/reports/general-ledger",
      icon: "📒"
    },
    {
      title: "Chart of Accounts",
      description: "View and manage your accounts",
      path: "/dashboard/accounting/chart-of-accounts",
      icon: "📂"
    },
    {
      title: "Income Statement",
      description: "View profit and loss over a period",
      path: "/dashboard/accounting/reports/income-statement",
      icon: "💹"
    },
    {
      title: "Balance Sheet",
      description: "View assets, liabilities, and equity",
      path: "/dashboard/accounting/reports/balance-sheet",
      icon: "⚖️"
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounting</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => router.push("/dashboard/accounting/diagnostics")}
          >
            System Diagnostics
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {sections.map((section, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-colors ${section.color}`}
            onClick={() => router.push(section.path)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={section.textColor}>{section.title}</CardTitle>
                <span className="text-3xl">{section.icon}</span>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" className={section.textColor}>
                Go to {section.title} →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {reports.map((report, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(report.path)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{report.title}</CardTitle>
                <span className="text-2xl">{report.icon}</span>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Double-Entry Accounting System</CardTitle>
            <CardDescription className="text-blue-700">
              Cloud Ledger uses a double-entry accounting system to ensure accurate financial records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Our system implements proper double-entry bookkeeping for all transactions, ensuring that:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-blue-700 mb-4">
              <li>Every transaction affects at least two accounts</li>
              <li>Total debits always equal total credits</li>
              <li>The accounting equation (Assets = Liabilities + Equity) is always balanced</li>
              <li>All financial statements are generated from the same consistent data</li>
            </ul>
            <p className="text-blue-700">
              Whether you use Transactions or Vouchers, all entries are properly recorded with their double-entry impact.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
