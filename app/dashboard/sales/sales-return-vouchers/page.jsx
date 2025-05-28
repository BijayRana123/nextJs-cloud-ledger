"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search, MoreVertical } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

export default function SalesReturnVouchersPage() {
  const [salesReturns, setSalesReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("approved");
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSalesReturns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization/sales-return-vouchers');
      const result = await response.json();
      if (response.ok) {
        setSalesReturns(result.salesReturnVouchers || []);
      } else {
        setError(result.message || "Failed to fetch sales return vouchers");
      }
    } catch (err) {
      setError("An error occurred while fetching the sales return vouchers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturns();
  }, []);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDate(new Date(dateString), isNepaliCalendar);
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredReturns = salesReturns.filter(voucher => {
    const statusMatches =
      activeTab === "approved" ? voucher.status === "APPROVED" :
      activeTab === "draft" ? voucher.status === "DRAFT" :
      true;
    const searchMatches = searchQuery === "" ||
      (voucher.customer?.name && voucher.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.referenceNo && voucher.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.totalAmount && voucher.totalAmount.toString().includes(searchQuery.toLowerCase()));
    return statusMatches && searchMatches;
  });

  // Add this function for toggling status
  const handleStatusToggle = async (voucherId, currentStatus) => {
    try {
      let response, result;
      if (currentStatus === 'APPROVED') {
        // Set to DRAFT via PUT
        response = await fetch(`/api/organization/sales-return-vouchers/${voucherId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'DRAFT' }),
        });
        result = await response.json();
      } else {
        // Set to APPROVED via approve API
        response = await fetch(`/api/organization/sales-return-vouchers/${voucherId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
      }
      if (response.ok) {
        setSalesReturns(prevReturns =>
          prevReturns.map(voucher =>
            voucher._id === voucherId ? { ...voucher, status: currentStatus === 'APPROVED' ? 'DRAFT' : 'APPROVED' } : voucher
          )
        );
        toast({
          title: 'Status Updated',
          description: `Sales return voucher status changed to ${currentStatus === 'APPROVED' ? 'DRAFT' : 'APPROVED'}`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Update Failed',
          description: result.message || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while updating the status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`/api/organization/sales-return-vouchers/${deletingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSalesReturns(prev => prev.filter(v => v._id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
        toast({ title: 'Deleted', description: 'Sales return voucher deleted successfully', variant: 'success' });
      } else {
        toast({ title: 'Delete Failed', description: 'Failed to delete sales return voucher', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred while deleting', variant: 'destructive' });
    }
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/sales/sales-return-vouchers/${id}/print`, '_blank');
  };

  if (isLoading) {
    return <div className="p-4">Loading sales return vouchers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Return Vouchers</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Calendar:</span>{" "}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
            </span>
          </div>
          <Link href="/dashboard/sales/add-sales-return" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
            <Rocket className="h-5 w-5 mr-2" />
            ADD NEW
          </Link>
        </div>
      </div>
      <Tabs defaultValue="approved" className="w-full" onValueChange={setActiveTab}>
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
              <span className="text-sm text-gray-700">1 - {filteredReturns.length} / {filteredReturns.length}</span>
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
            placeholder="Search by customer, reference number, ..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <TabsContent value="approved">
          <CustomTable>
            <CustomTableHeader>
              <CustomTableRow className="bg-gray-100">
                <CustomTableHead>CUSTOMER</CustomTableHead>
                <CustomTableHead>REFERENCE NO</CustomTableHead>
                <CustomTableHead>DATE</CustomTableHead>
                <CustomTableHead>AMOUNT</CustomTableHead>
                <CustomTableHead>STATUS</CustomTableHead>
                <CustomTableHead>ACTIONS</CustomTableHead>
              </CustomTableRow>
            </CustomTableHeader>
            <CustomTableBody>
              {filteredReturns.filter(voucher => voucher.status === 'APPROVED').map((voucher) => (
                <CustomTableRow
                  key={voucher._id}
                  className={"cursor-pointer"}
                  onClick={e => {
                    if (
                      e.target.closest('button') ||
                      e.target.closest('input[type=checkbox]') ||
                      e.target.closest('.switch')
                    ) return;
                    router.push(`/dashboard/sales/sales-return-vouchers/${voucher._id}`);
                  }}
                >
                  <CustomTableCell>{voucher.customer?.name || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{voucher.referenceNo}</CustomTableCell>
                  <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                  <CustomTableCell>{voucher.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                  <CustomTableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      voucher.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      voucher.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {voucher.status || 'N/A'}
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
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/sales/add-sales-return?id=${voucher._id}`); }}>
                          Edit
                        </DropdownMenuItem>
                        {voucher.status !== 'DRAFT' && (
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusToggle(voucher._id, voucher.status); }}>
                            Switch to Draft
                          </DropdownMenuItem>
                        )}
                        {voucher.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(voucher._id); }}>
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }}>
                          Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CustomTableCell>
                </CustomTableRow>
              ))}
              {filteredReturns.filter(voucher => voucher.status === 'APPROVED').length === 0 && (
                <CustomTableRow>
                  <CustomTableCell colSpan={8} className="text-center py-4">
                    {searchQuery ? "No matching sales return vouchers found." : "No approved sales return vouchers found."}
                  </CustomTableCell>
                </CustomTableRow>
              )}
            </CustomTableBody>
          </CustomTable>
        </TabsContent>
        <TabsContent value="draft">
          <CustomTable>
            <CustomTableHeader>
              <CustomTableRow className="bg-gray-100">
                <CustomTableHead>CUSTOMER</CustomTableHead>
                <CustomTableHead>REFERENCE NO</CustomTableHead>
                <CustomTableHead>DATE</CustomTableHead>
                <CustomTableHead>AMOUNT</CustomTableHead>
                <CustomTableHead>STATUS</CustomTableHead>
                <CustomTableHead>ACTIONS</CustomTableHead>
              </CustomTableRow>
            </CustomTableHeader>
            <CustomTableBody>
              {filteredReturns.filter(voucher => voucher.status === 'DRAFT').map((voucher) => (
                <CustomTableRow
                  key={voucher._id}
                  className={"cursor-pointer"}
                  onClick={e => {
                    if (
                      e.target.closest('button') ||
                      e.target.closest('input[type=checkbox]') ||
                      e.target.closest('.switch')
                    ) return;
                    router.push(`/dashboard/sales/sales-return-vouchers/${voucher._id}`);
                  }}
                >
                  <CustomTableCell>{voucher.customer?.name || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{voucher.referenceNo}</CustomTableCell>
                  <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                  <CustomTableCell>{voucher.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                  <CustomTableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      voucher.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                      voucher.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {voucher.status || 'N/A'}
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
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/sales/add-sales-return?id=${voucher._id}`); }}>
                          Edit
                        </DropdownMenuItem>
                        {voucher.status !== 'DRAFT' && (
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusToggle(voucher._id, voucher.status); }}>
                            Switch to Draft
                          </DropdownMenuItem>
                        )}
                        {voucher.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(voucher._id); }}>
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }}>
                          Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CustomTableCell>
                </CustomTableRow>
              ))}
              {filteredReturns.filter(voucher => voucher.status === 'DRAFT').length === 0 && (
                <CustomTableRow>
                  <CustomTableCell colSpan={8} className="text-center py-4">
                    {searchQuery ? "No matching sales return vouchers found." : "No draft sales return vouchers found."}
                  </CustomTableCell>
                </CustomTableRow>
              )}
            </CustomTableBody>
          </CustomTable>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sales Return Voucher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sales return voucher? This action cannot be undone.
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