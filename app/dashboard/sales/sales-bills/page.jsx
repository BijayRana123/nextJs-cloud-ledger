"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable"; // Import custom table components
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket } from "lucide-react"; // Icons for buttons and pagination
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Import shadcn/ui select components
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";

export default function SalesBillsPage() { // Keep the component name as SalesBillsPage
  const [salesOrders, setSalesOrders] = useState([]); // State to hold sales orders
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isNepaliCalendar } = useCalendar();

  const fetchSalesOrders = async () => { // Function to fetch sales orders
    setIsLoading(true);
    setError(null);
    try {
      // Fetch data from the sales orders API endpoint
      const response = await fetch('/api/organization/sales-orders');
      const result = await response.json();

      if (response.ok) {
        setSalesOrders(result.salesOrders); // Updated to setSalesOrders
      } else {
        setError(result.message || "Failed to fetch sales orders");
      }
    } catch (err) {
      console.error("Error fetching sales orders:", err);
      setError("An error occurred while fetching the sales orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders(); // Fetch sales orders on component mount
  }, []);

  // Format date based on the selected calendar type
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDate(new Date(dateString), isNepaliCalendar);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading sales orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Bills (Displaying Sales Orders)</h1> {/* Updated title */}
        {/* Apply button styling directly to the Link */}
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Calendar:</span>{" "}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
            </span>
          </div>
          <Link href="/dashboard/sales/add-sales-bill" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2"> {/* Updated link to sales bills */}
            <Rocket className="h-5 w-5 mr-2" /> {/* Changed icon to Rocket */}
            ADD NEW
          </Link>
        </div>
      </div>

      <Tabs defaultValue="approved" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            {/* Add other tabs if necessary */}
          </TabsList>
          <div className="flex items-center gap-4">
             {/* Rows Count and Pagination */}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Rows Count</span>
              <Select defaultValue="20"> {/* Added Select for Rows Count */}
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
              {/* Placeholder text updated - will need dynamic values */}
              <span className="text-sm text-gray-700">1 - {salesOrders.length} / {salesOrders.length}</span> {/* Updated length */}
              <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            {/* Options Button */}
            <Button variant="outline">
              <Menu className="h-4 w-4 mr-2" />
              OPTIONS
            </Button>
          </div>
        </div>

        <Input
          type="text"
          placeholder="Search..."
          className="mb-4"
        />

        <TabsContent value="approved">
          <div className="border rounded-md">
            <CustomTable>
              <CustomTableHeader>
                <CustomTableRow className="bg-gray-100">
                  <CustomTableHead><input type="checkbox" /></CustomTableHead>
                  <CustomTableHead>Customer</CustomTableHead>
                  <CustomTableHead>ORDER NO</CustomTableHead>
                  <CustomTableHead>REFERENCE NO</CustomTableHead>
                  <CustomTableHead>DATE</CustomTableHead>
                  <CustomTableHead>AMOUNT</CustomTableHead>
                  <CustomTableHead>STAGE</CustomTableHead>
                </CustomTableRow>
              </CustomTableHeader>
              <CustomTableBody>
                {salesOrders.map((order) => (
                  <CustomTableRow key={order._id} className={order.highlighted ? "bg-green-50" : ""}>
                    <CustomTableCell><input type="checkbox" /></CustomTableCell>
                    <CustomTableCell>{order.customer?.name || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.salesOrderNumber || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.referenceNo || ''}</CustomTableCell>
                    <CustomTableCell>{formatDateDisplay(order.date)}</CustomTableCell>
                    <CustomTableCell>{order.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                    <CustomTableCell>{order.status || 'N/A'}</CustomTableCell>
                  </CustomTableRow>
                ))}
              </CustomTableBody>
            </CustomTable>
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div>
            <p>Placeholder for Draft Sales Bills table.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
