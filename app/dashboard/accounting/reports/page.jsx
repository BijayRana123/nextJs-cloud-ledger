"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const router = useRouter();

  // Financial reports
  const reports = [
    {
      title: "Income Statement",
      description: "View profit and loss over a period",
      path: "/dashboard/accounting/reports/income-statement",
      color: "bg-green-50 hover:bg-green-100",
      textColor: "text-green-700",
      icon: "💹"
    },
    {
      title: "Balance Sheet",
      description: "View assets, liabilities, and equity",
      path: "/dashboard/accounting/reports/balance-sheet",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      icon: "⚖️"
    },
    {
      title: "General Ledger",
      description: "View the complete record of all transactions",
      path: "/dashboard/accounting/reports/general-ledger",
      color: "bg-amber-50 hover:bg-amber-100",
      textColor: "text-amber-700",
      icon: "📒"
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting")}
        >
          Back to Accounting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {reports.map((report, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-colors ${report.color}`}
            onClick={() => router.push(report.path)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={report.textColor}>{report.title}</CardTitle>
                <span className="text-3xl">{report.icon}</span>
              </div>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" className={report.textColor}>
                View {report.title} →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-800">About Financial Reports</CardTitle>
            <CardDescription className="text-gray-700">
              Understanding your financial position with accurate, up-to-date statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Our financial reports provide comprehensive insights into your business's financial health:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><span className="font-medium">Income Statement:</span> Shows your revenue, expenses, and profit/loss over a specific period</li>
              <li><span className="font-medium">Balance Sheet:</span> Displays your assets, liabilities, and equity at a specific point in time</li>
              <li><span className="font-medium">General Ledger:</span> Provides a detailed record of all transactions across all accounts</li>
            </ul>
            <p className="text-gray-700">
              All reports are generated in real-time from your transaction data, ensuring accurate financial insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
