"use client"

import { useState } from "react"
import { Calendar, Users, ShoppingCart, BarChart2, Package, FileText, List, CreditCard, Scale } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuickLinkCard } from "../components/quick-link-card"
import { DateDisplay } from "../components/DateDisplay"
import { useCalendar } from "@/lib/context/CalendarContext"
import { getCurrentDate } from "@/lib/utils/dateUtils"
// Sidebar and TopNavbar are now handled in the layout.jsx
// import { Sidebar } from "../components/sidebar"
// import { TopNavbar } from "../components/top-navbar"
import { MobileSidebar } from "../components/mobile-sidebar" // Assuming MobileSidebar is needed
import AddCustomerModal from '@/components/sales/add-customer-modal';
import CreateNewProductModal from '@/components/create-new-product-modal';
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("sales")
  const { isNepaliCalendar } = useCalendar()
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const router = useRouter();

  const quickLinks = [
    {
      title: 'Add Customer',
      icon: <Users className="h-4 w-4" />,
      onClick: () => setIsAddCustomerModalOpen(true),
    },
    {
      title: 'Add Item',
      icon: <Package className="h-4 w-4" />,
      onClick: () => setIsAddItemModalOpen(true),
    },
    {
      title: 'Trial Balance',
      icon: <Scale className="h-4 w-4" />,
      onClick: () => router.push('/dashboard/accounting/reports/trial-balance'),
    },
  ];

  return (
    <div className="flex h-screen flex-col"> {/* This flex-col is likely redundant with layout */}
      {/* TopNavbar is now in layout */}
      {/* <TopNavbar>
        <MobileSidebar />
      </TopNavbar> */}

      <div className="flex flex-1 overflow-hidden"> {/* This flex container is likely redundant with layout */}
        {/* Sidebar is now in layout */}
        {/* <Sidebar /> */}

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Quick Links</h2>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
              Edit Links
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {quickLinks.map((link, index) => (
              <div key={index} onClick={link.onClick} style={{ cursor: 'pointer' }}>
                <QuickLinkCard title={link.title} icon={link.icon} />
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h3 className="text-lg font-medium">Today's Date</h3>
              <p className="text-gray-600">
                <DateDisplay date={new Date()} className="font-semibold" />
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Current Calendar Type</h3>
              <p className="text-gray-600 font-semibold">
                {isNepaliCalendar ? 'Nepali Calendar (BS)' : 'English Calendar (AD)'}
              </p>
            </div>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Last Sale Date:</span>
                      <DateDisplay date="2023-10-15" className="text-blue-600 font-medium" />
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Next Delivery Date:</span>
                      <DateDisplay date="2023-10-25" className="text-green-600 font-medium" />
                    </div>
                    <p>Your sales dashboard content will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="purchase">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Last Purchase Date:</span>
                      <DateDisplay date="2023-10-12" className="text-purple-600 font-medium" />
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Next Order Date:</span>
                      <DateDisplay date="2023-10-20" className="text-orange-600 font-medium" />
                    </div>
                    <p>Your purchase dashboard content will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Overview</CardTitle>
                </CardHeader>
                <CardContent>
                   {/* Placeholder for Receipt content - replace with actual components/data */}
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
                   {/* Placeholder for Payment content - replace with actual components/data */}
                  <p>Your payment dashboard content will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <AddCustomerModal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} />
      <CreateNewProductModal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} />
    </div>
  )
}
