"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function VouchersPage() {
  const router = useRouter();

  // Voucher types with descriptions
  const voucherTypes = [
    {
      title: "Payment Voucher",
      description: "Record payments to suppliers and vendors",
      path: "/dashboard/accounting/vouchers/payment",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-700",
      icon: "💸"
    },
    {
      title: "Receipt Voucher",
      description: "Record payments received from customers",
      path: "/dashboard/accounting/vouchers/receipt",
      color: "bg-green-50 hover:bg-green-100",
      textColor: "text-green-700",
      icon: "💰"
    },
    {
      title: "Expense Voucher",
      description: "Record business expenses",
      path: "/dashboard/accounting/vouchers/expense",
      color: "bg-orange-50 hover:bg-orange-100",
      textColor: "text-orange-700",
      icon: "📝"
    },
    {
      title: "Income Voucher",
      description: "Record other income sources",
      path: "/dashboard/accounting/vouchers/income",
      color: "bg-emerald-50 hover:bg-emerald-100",
      textColor: "text-emerald-700",
      icon: "📈"
    },
    {
      title: "Sales Voucher",
      description: "Record sales transactions",
      path: "/dashboard/accounting/vouchers/sales",
      color: "bg-sky-50 hover:bg-sky-100",
      textColor: "text-sky-700",
      icon: "🛒"
    },
    {
      title: "Purchase Voucher",
      description: "Record purchase transactions",
      path: "/dashboard/accounting/vouchers/purchase",
      color: "bg-indigo-50 hover:bg-indigo-100",
      textColor: "text-indigo-700",
      icon: "🛍️"
    },
    {
      title: "Owner Investment",
      description: "Record owner's contributions to the business",
      path: "/dashboard/accounting/vouchers/owner-investment",
      color: "bg-purple-50 hover:bg-purple-100",
      textColor: "text-purple-700",
      icon: "🏦"
    },
    {
      title: "Owner Drawings",
      description: "Record owner's withdrawals from the business",
      path: "/dashboard/accounting/vouchers/owner-drawings",
      color: "bg-red-50 hover:bg-red-100",
      textColor: "text-red-700",
      icon: "🧾"
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounting Vouchers</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting")}
        >
          Back to Accounting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voucherTypes.map((voucher, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-colors ${voucher.color}`}
            onClick={() => router.push(voucher.path)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={voucher.textColor}>{voucher.title}</CardTitle>
                <span className="text-3xl">{voucher.icon}</span>
              </div>
              <CardDescription>{voucher.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" className={voucher.textColor}>
                Create {voucher.title} →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>View Voucher Records</CardTitle>
            <CardDescription>View and manage existing voucher entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => router.push("/dashboard/accounting/journal-entries")}>
                View All Journal Entries
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/accounting/reports")}>
                View Financial Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 