"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable"; // Import custom table components
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search } from "lucide-react"; // Added Check, X, and Search icons
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Import shadcn/ui select components
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import { toast } from "@/components/ui/use-toast"; // Import toast for notifications
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function SalesBillsPage() { // Keep the component name as SalesBillsPage
  const [salesOrders, setSalesOrders] = useState([]); // State to hold sales orders
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("approved");
  const [searchQuery, setSearchQuery] = useState(""); // Added search query state
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  // Handle status toggle
  const handleStatusToggle = async (orderId, currentStatus) => {
    try {
      // Determine the new status
      const newStatus = currentStatus === 'APPROVED' ? 'DRAFT' : 'APPROVED';
      
      // Call the API to update the status
      const response = await fetch(`/api/organization/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Update the local state
        setSalesOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Show success message
        toast({
          title: "Status Updated",
          description: `Sales order status changed to ${newStatus}`,
          variant: "success",
        });
      } else {
        // Show error message
        toast({
          title: "Update Failed",
          description: result.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the status",
        variant: "destructive",
      });
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter orders based on active tab and search query
  const filteredOrders = salesOrders.filter(order => {
    // Status filter
    const statusMatches = 
      activeTab === "approved" ? order.status === "APPROVED" :
      activeTab === "draft" ? order.status === "DRAFT" : 
      true;
    
    // Search filter - check if search query exists in various fields
    const searchMatches = searchQuery === "" || 
      (order.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.salesOrderNumber && order.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.referenceNo && order.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.totalAmount && order.totalAmount.toString().includes(searchQuery.toLowerCase()));
    
    return statusMatches && searchMatches;
  });

  const handleDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`/api/organization/sales-orders/${deletingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSalesOrders(prev => prev.filter(v => v._id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
        toast({ title: 'Deleted', description: 'Sales bill deleted successfully', variant: 'success' });
      } else {
        toast({ title: 'Delete Failed', description: 'Failed to delete sales bill', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred while deleting', variant: 'destructive' });
    }
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/sales/sales-bills/${id}/print`, '_blank');
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
        <h1 className="text-2xl font-bold">Sales Bills</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Calendar:</span>{" "}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
            </span>
          </div>
          <Link href="/dashboard/sales/add-sales-bill" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
            <Rocket className="h-5 w-5 mr-2" />
          ADD NEW
        </Link>
        </div>
      </div>

      <Tabs 
        defaultValue="approved" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Rows Count</span>
              <Select defaultValue="20">
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
              <span className="text-sm text-gray-700">1 - {filteredOrders.length} / {filteredOrders.length}</span>
              <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline">
              <Menu className="h-4 w-4 mr-2" />
              OPTIONS
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
            placeholder="Search by customer, order number, reference..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <TabsContent value="approved">
          <div className="border rounded-md">
            <CustomTable>
              <CustomTableHeader>
                <CustomTableRow className="bg-gray-100">
                  <CustomTableHead>CUSTOMER</CustomTableHead>
                  <CustomTableHead>ORDER NO</CustomTableHead>
                  <CustomTableHead>REFERENCE NO</CustomTableHead>
                  <CustomTableHead>DATE</CustomTableHead>
                  <CustomTableHead>AMOUNT</CustomTableHead>
                  <CustomTableHead>STATUS</CustomTableHead>
                  <CustomTableHead>ACTIONS</CustomTableHead>
                </CustomTableRow>
              </CustomTableHeader>
              <CustomTableBody>
                {filteredOrders.map((order) => (
                  <CustomTableRow
                    key={order._id}
                    className={(order.highlighted ? "bg-green-50 " : "") + " cursor-pointer"}
                    onClick={e => {
                      if (
                        e.target.closest('button') ||
                        e.target.closest('input[type=checkbox]') ||
                        e.target.closest('.switch')
                      ) return;
                      router.push(`/dashboard/sales/sales-orders/${order._id}`);
                    }}
                  >
                    <CustomTableCell>{order.customer?.name || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.salesOrderNumber || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.referenceNo || ''}</CustomTableCell>
                    <CustomTableCell>{formatDateDisplay(order.date)}</CustomTableCell>
                    <CustomTableCell>{order.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                    <CustomTableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'N/A'}
                      </span>
                    </CustomTableCell>
                    <CustomTableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/sales/add-sales-bill?id=${order._id}`); }}>
                            Edit
                          </DropdownMenuItem>
                          {order.status !== 'DRAFT' && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusToggle(order._id, order.status); }}>
                              Switch to Draft
                            </DropdownMenuItem>
                          )}
                          {order.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(order._id); }}>
                              Delete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handlePrint(order._id); }}>
                            Print
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CustomTableCell>
                  </CustomTableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <CustomTableRow>
                    <CustomTableCell colSpan={8} className="text-center py-4">
                      {searchQuery ? "No matching sales orders found." : "No approved sales orders found."}
                    </CustomTableCell>
                  </CustomTableRow>
                )}
              </CustomTableBody>
            </CustomTable>
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div className="border rounded-md">
            <CustomTable>
              <CustomTableHeader>
                <CustomTableRow className="bg-gray-100">
                  <CustomTableHead>CUSTOMER</CustomTableHead>
                  <CustomTableHead>ORDER NO</CustomTableHead>
                  <CustomTableHead>REFERENCE NO</CustomTableHead>
                  <CustomTableHead>DATE</CustomTableHead>
                  <CustomTableHead>AMOUNT</CustomTableHead>
                  <CustomTableHead>STATUS</CustomTableHead>
                  <CustomTableHead>ACTIONS</CustomTableHead>
                </CustomTableRow>
              </CustomTableHeader>
              <CustomTableBody>
                {filteredOrders.map((order) => (
                  <CustomTableRow
                    key={order._id}
                    className={(order.highlighted ? "bg-green-50 " : "") + " cursor-pointer"}
                    onClick={e => {
                      if (
                        e.target.closest('button') ||
                        e.target.closest('input[type=checkbox]') ||
                        e.target.closest('.switch')
                      ) return;
                      router.push(`/dashboard/sales/sales-orders/${order._id}`);
                    }}
                  >
                    <CustomTableCell>{order.customer?.name || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.salesOrderNumber || 'N/A'}</CustomTableCell>
                    <CustomTableCell>{order.referenceNo || ''}</CustomTableCell>
                    <CustomTableCell>{formatDateDisplay(order.date)}</CustomTableCell>
                    <CustomTableCell>{order.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                    <CustomTableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'N/A'}
                      </span>
                    </CustomTableCell>
                    <CustomTableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/sales/add-sales-bill?id=${order._id}`); }}>
                            Edit
                          </DropdownMenuItem>
                          {order.status !== 'DRAFT' && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusToggle(order._id, order.status); }}>
                              Switch to Draft
                            </DropdownMenuItem>
                          )}
                          {order.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(order._id); }}>
                              Delete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handlePrint(order._id); }}>
                            Print
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CustomTableCell>
                  </CustomTableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <CustomTableRow>
                    <CustomTableCell colSpan={8} className="text-center py-4">
                      {searchQuery ? "No matching sales orders found." : "No draft sales orders found."}
                    </CustomTableCell>
                  </CustomTableRow>
                )}
              </CustomTableBody>
            </CustomTable>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sales Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sales bill? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
