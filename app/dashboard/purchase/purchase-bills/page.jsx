"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable"; // Import custom table components
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search } from "lucide-react"; // Added Search icon
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

export default function PurchaseBillsPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch data from the purchase orders API endpoint
      const response = await fetch('/api/organization/purchase-orders');
      const result = await response.json();

      if (response.ok) {
        setPurchaseOrders(result.purchaseOrders); // Assuming the response contains a purchaseOrders array
      } else {
        setError(result.message || "Failed to fetch purchase orders");
      }
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      setError("An error occurred while fetching the purchase orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []); // Fetch data on component mount

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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter orders based on search query
  const filteredOrders = purchaseOrders.filter(order => {
    // Search filter - check if search query exists in various fields
    const searchMatches = searchQuery === "" || 
      (order.supplier?.name && order.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.purchaseOrderNumber && order.purchaseOrderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.referenceNo && order.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.totalAmount && order.totalAmount.toString().includes(searchQuery.toLowerCase()));
    
    return searchMatches;
  });

  const handleDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`/api/organization/purchase-orders/${deletingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPurchaseOrders(prev => prev.filter(v => v._id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
        toast({ title: 'Deleted', description: 'Purchase bill deleted successfully', variant: 'success' });
      } else {
        toast({ title: 'Delete Failed', description: 'Failed to delete purchase bill', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred while deleting', variant: 'destructive' });
    }
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/purchase/purchase-bills/${id}/print`, '_blank');
  };

  if (isLoading) {
    return <div className="p-4">Loading purchase orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Calendar:</span>{" "}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
            </span>
          </div>
          <Link href="/dashboard/purchase/add-purchase-bill" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
            <Rocket className="h-5 w-5 mr-2" />
          ADD NEW
        </Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
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
          placeholder="Search by supplier, order number, reference..."
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

      <div className="border rounded-md">
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow className="bg-gray-100">
              <CustomTableHead>SUPPLIER</CustomTableHead>
              <CustomTableHead>ORDER NO</CustomTableHead>
              <CustomTableHead>REFERENCE NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>AMOUNT</CustomTableHead>
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
                  router.push(`/dashboard/purchase/purchase-orders/${order._id}`);
                }}
              >
                <CustomTableCell>{order.supplier?.name || 'N/A'}</CustomTableCell>
                <CustomTableCell>{order.purchaseOrderNumber || 'N/A'}</CustomTableCell>
                <CustomTableCell>{order.referenceNo || ''}</CustomTableCell>
                <CustomTableCell>{formatDateDisplay(order.date)}</CustomTableCell>
                <CustomTableCell>{order.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                <CustomTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/purchase/add-purchase-bill?id=${order._id}`); }}>
                        Edit
                      </DropdownMenuItem>
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
                  {searchQuery ? "No matching purchase orders found." : "No purchase orders found."}
                </CustomTableCell>
              </CustomTableRow>
            )}
          </CustomTableBody>
        </CustomTable>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase bill? This action cannot be undone.
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
