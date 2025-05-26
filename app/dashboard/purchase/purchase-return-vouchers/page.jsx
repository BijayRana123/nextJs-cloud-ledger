"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function PurchaseReturnVouchersPage() {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("approved");
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();

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
    const statusMatches =
      activeTab === "approved" ? voucher.status === "APPROVED" :
      activeTab === "draft" ? voucher.status === "DRAFT" :
      true;
    const searchMatches = searchQuery === "" ||
      (voucher.supplier?.name && voucher.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.referenceNo && voucher.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.totalAmount && voucher.totalAmount.toString().includes(searchQuery.toLowerCase()));
    return statusMatches && searchMatches;
  });

  const handleStatusToggle = async (voucherId, currentStatus) => {
    try {
      let response, result;
      if (currentStatus === 'APPROVED') {
        // Set to DRAFT via PUT
        response = await fetch(`/api/organization/purchase-return-vouchers`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: voucherId, status: 'DRAFT' }),
        });
        result = await response.json();
      } else {
        // Set to APPROVED via approve API
        response = await fetch(`/api/organization/purchase-return-vouchers/${voucherId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
      }
      if (response.ok) {
        setPurchaseReturns(prevReturns =>
          prevReturns.map(voucher =>
            voucher._id === voucherId ? { ...voucher, status: currentStatus === 'APPROVED' ? 'DRAFT' : 'APPROVED' } : voucher
          )
        );
        toast({
          title: 'Status Updated',
          description: `Purchase return voucher status changed to ${currentStatus === 'APPROVED' ? 'DRAFT' : 'APPROVED'}`,
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
            placeholder="Search by supplier, reference number, ..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <TabsContent value="approved">
          <CustomTable>
            <CustomTableHeader>
              <CustomTableRow>
                <CustomTableHead>Supplier</CustomTableHead>
                <CustomTableHead>Reference No</CustomTableHead>
                <CustomTableHead>Date</CustomTableHead>
                <CustomTableHead>Total Amount</CustomTableHead>
                <CustomTableHead>Status</CustomTableHead>
                <CustomTableHead>Action</CustomTableHead>
              </CustomTableRow>
            </CustomTableHeader>
            <CustomTableBody>
              {filteredReturns.map((voucher, idx) => (
                <CustomTableRow key={voucher._id || idx}>
                  <CustomTableCell>{voucher.supplier?.name || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{voucher.referenceNo}</CustomTableCell>
                  <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                  <CustomTableCell>{voucher.totalAmount}</CustomTableCell>
                  <CustomTableCell>{voucher.status}</CustomTableCell>
                  <CustomTableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={voucher.status === 'APPROVED'}
                        onCheckedChange={() => handleStatusToggle(voucher._id, voucher.status)}
                        aria-label="Toggle status"
                      />
                      <span className="text-xs text-gray-500">
                        {voucher.status === 'APPROVED' ? 'Set to Draft' : 'Set to Approved'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/purchase/purchase-return-vouchers/${voucher._id}`)}>
                        View
                      </Button>
                    </div>
                  </CustomTableCell>
                </CustomTableRow>
              ))}
            </CustomTableBody>
          </CustomTable>
        </TabsContent>
        <TabsContent value="draft">
          {/* Optionally filter for draft status only */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 