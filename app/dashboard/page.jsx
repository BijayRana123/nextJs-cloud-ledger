"use client"

import { useState } from "react"
import { Calendar, Users, ShoppingCart, BarChart2, Package, FileText, List, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuickLinkCard } from "../components/quick-link-card"
import { Sidebar } from "../components/sidebar"
import { TopNavbar } from "../components/top-navbar"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("sales")

  const quickLinks = [
    { title: "Tasks", category: "", icon: <List className="h-4 w-4" /> },
    { title: "Customer Payment", category: "Sales", icon: <CreditCard className="h-4 w-4" /> },
    { title: "Customers", category: "Sales", icon: <Users className="h-4 w-4" /> },
    { title: "Quotations", category: "Sales", icon: <FileText className="h-4 w-4" /> },
    { title: "Contact Group", category: "CRM", icon: <Users className="h-4 w-4" /> },
    { title: "Leads", category: "CRM", icon: <Users className="h-4 w-4" /> },
    { title: "Units Of Measurement", category: "Inventory", icon: <Package className="h-4 w-4" /> },
    { title: "Debit Notes", category: "Purchase", icon: <FileText className="h-4 w-4" /> },
    { title: "Purchase Order", category: "Purchase", icon: <ShoppingCart className="h-4 w-4" /> },
    { title: "Allocate Customer Payments", category: "Sales", icon: <CreditCard className="h-4 w-4" /> },
    { title: "Journal report", category: "Reports", icon: <BarChart2 className="h-4 w-4" /> },
  ]

  return (
    <div className="flex h-screen flex-col">
      <TopNavbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Quick Links</h2>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
              Edit Links
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {quickLinks.map((link, index) => (
              <QuickLinkCard key={index} title={link.title} category={link.category} icon={link.icon} />
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </Button>
          </div>

          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="receipt">Receipt</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Your sales dashboard content will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="purchase">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Your purchase dashboard content will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Your receipt dashboard content will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Your payment dashboard content will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
