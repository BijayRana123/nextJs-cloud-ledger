"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search, FileEdit, Trash2, Printer } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
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

export default function PurchaseReturnVouchersPage() {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPurchaseReturns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization/purchase-return-vouchers');
      const result = await response.json();
      if (response.ok) {
        setPurchaseReturns(result.purchaseReturnVouchers || []);
      } else {
        setError(result.message || "Failed to fetch purchase return vouchers");
      }
    } catch (err) {
      setError("An error occurred while fetching the purchase return vouchers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseReturns();
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

  const filteredReturns = purchaseReturns.filter(voucher => {
    const statusMatches = voucher.status === "APPROVED";
    const searchMatches = searchQuery === "" ||
      (voucher.supplier?.name && voucher.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.referenceNo && voucher.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.totalAmount && voucher.totalAmount.toString().includes(searchQuery.toLowerCase()));
    return statusMatches && searchMatches;
  });

  const handleDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`/api/organization/purchase-return-vouchers/${deletingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPurchaseReturns(prev => prev.filter(v => v._id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
        toast({ title: 'Deleted', description: 'Purchase return voucher deleted successfully', variant: 'success' });
      } else {
        toast({ title: 'Delete Failed', description: 'Failed to delete purchase return voucher', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred while deleting', variant: 'destructive' });
    }
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/purchase/purchase-return-vouchers/${id}/print`, '_blank');
  };

  if (isLoading) {
    return <div className="p-4">Loading purchase return vouchers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Return Vouchers</h1>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/purchase/add-purchase-return" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
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
          placeholder="Search by supplier, reference number, ..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <CustomTable>
        <CustomTableHeader>
          <CustomTableRow className="bg-gray-100">
            <CustomTableHead>CUSTOMER</CustomTableHead>
            <CustomTableHead>REFERENCE NO</CustomTableHead>
            <CustomTableHead>DATE</CustomTableHead>
            <CustomTableHead>AMOUNT</CustomTableHead>
            <CustomTableHead>ACTIONS</CustomTableHead>
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          {filteredReturns.map((voucher) => (
            <CustomTableRow
              key={voucher._id}
              className={"cursor-pointer"}
              onClick={e => {
                if (
                  e.target.closest('button') ||
                  e.target.closest('input[type=checkbox]') ||
                  e.target.closest('.switch')
                ) return;
                router.push(`/dashboard/purchase/purchase-return-vouchers/${voucher._id}`);
              }}
            >
              <CustomTableCell>{voucher.supplier?.name || 'N/A'}</CustomTableCell>
              <CustomTableCell>{voucher.referenceNo}</CustomTableCell>
              <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
              <CustomTableCell>{voucher.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
              <CustomTableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); router.push(`/dashboard/sales/add-sales-return?id=${voucher._id}`); }} title="Edit"><FileEdit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={e => { e.stopPropagation(); handleDelete(voucher._id); }} disabled={isDeleting} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                </div>
              </CustomTableCell>
            </CustomTableRow>
          ))}
          {filteredReturns.length === 0 && (
            <CustomTableRow>
              <CustomTableCell colSpan={8} className="text-center py-4">
                {searchQuery ? "No matching purchase return vouchers found." : "No purchase return vouchers found."}
              </CustomTableCell>
            </CustomTableRow>
          )}
        </CustomTableBody>
      </CustomTable>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase Return Voucher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase return voucher? This action cannot be undone.
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