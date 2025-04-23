import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CreditCard, Package } from "lucide-react"; // Example icons for Quick Links and Stats

// Placeholder component for Quick Link Card
function QuickLinkCard({ title, subtitle, icon: Icon }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {Icon && <Icon className="h-6 w-6 text-gray-600" />}
    </Card>
  );
}

// Placeholder component for Stat Card
function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {/* Optional: Add a tooltip or description here */}
        {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  return (
    <div className="p-4">
      {/* Header - already in layout, but adding a title for context */}
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Revenue" value="$45,231.89" icon={DollarSign} />
        <StatCard title="Expenses" value="$15,122.31" icon={CreditCard} />
        <StatCard title="Stock Value" value="$25,500.00" icon={Package} />
      </div>


      {/* Quick Links Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quick Links</h2>
          <Button variant="outline">Edit Links</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Example Quick Link Cards - replace with actual data/components */}
          <QuickLinkCard title="Tasks" subtitle="CRM" icon={Plus} />
          <QuickLinkCard title="Customer Payment" subtitle="Sales" icon={Plus} />
          <QuickLinkCard title="Customers" subtitle="Sales" icon={Plus} />
          <QuickLinkCard title="Quotations" subtitle="Sales" icon={Plus} />
          <QuickLinkCard title="Contact Group" subtitle="CRM" icon={null} /> {/* Example without icon */}
          <QuickLinkCard title="Leads" subtitle="CRM" icon={Plus} />
          <QuickLinkCard title="Units Of Measurement" subtitle="Inventory" icon={null} />
          <QuickLinkCard title="Debit Notes" subtitle="Purchase" icon={null} />
          <QuickLinkCard title="Purchase Order" subtitle="Purchase" icon={null} />
          <QuickLinkCard title="Allocate Customer Payments" subtitle="Sales" icon={null} />
          <QuickLinkCard title="Journal report" subtitle="Reports" icon={null} />
        </div>
      </div>

      {/* Sections below Quick Links - Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Sales</CardTitle></CardHeader>
          <CardContent>{/* Sales content */}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Purchase</CardTitle></CardHeader>
          <CardContent>{/* Purchase content */}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Receipt</CardTitle></CardHeader>
          <CardContent>{/* Receipt content */}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
          <CardContent>{/* Payment content */}</CardContent>
        </Card>
      </div>
    </div>
  );
}
