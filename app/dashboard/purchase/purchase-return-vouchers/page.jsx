"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search, FileEdit, Trash2, Printer, Mail, FileSpreadsheet, FileText } from "lucide-react";
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
import PurchaseReturnExcelDownload from "@/components/purchase/PurchaseReturnExcelDownload";
import PurchaseReturnPdfDownload from "@/components/purchase/PurchaseReturnPdfDownload";
import EmailModal from "@/components/email-modal";

export default function PurchaseReturnVouchersPage() {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailVoucher, setEmailVoucher] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

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

  const filteredReturns = purchaseReturns
    .filter(voucher => {
      const searchMatches = searchQuery === "" ||
        (voucher.supplier?.name && voucher.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voucher.referenceNo && voucher.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voucher.billNumber && voucher.billNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voucher.totalAmount && voucher.totalAmount.toString().includes(searchQuery.toLowerCase()));
      return searchMatches;
    })
    .sort((a, b) => {
      // Sort by date descending first
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      // If dates are equal, sort by referenceNo descending (numeric part)
      const getNum = ref => {
        if (!ref) return 0;
        const match = ref.match(/\d+/g);
        return match ? parseInt(match.join(''), 10) : 0;
      };
      return getNum(b.referenceNo) - getNum(a.referenceNo);
    });

  const handlePrint = (id) => {
    window.open(`/dashboard/purchase/purchase-return-vouchers/${id}/print`, '_blank');
  };

  // Add PDF preview generation for email modal
  const generatePdfBase64 = async (voucher) => {
    const jsPDFModule = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDFModule.jsPDF('p', 'pt');
    doc.setFontSize(18);
    doc.text('[Company Name]', 40, 40);
    doc.setFontSize(10);
    doc.text('[Street Address]', 40, 60);
    doc.text('[City, ST ZIP]', 40, 75);
    doc.text('Phone: [000-000-0000]', 40, 90);
    doc.text('Fax: [000-000-0000]', 40, 105);
    doc.setFontSize(24);
    doc.setTextColor('#3a5da8');
    doc.text('PURCHASE RETURN VOUCHER', 420, 50, { align: 'right' });
    doc.setTextColor('#222');
    doc.setFontSize(12);
    autoTable(doc, {
      startY: 120,
      head: [['DATE', 'PURCHASE RETURN VOUCHER NO', 'BILL NO', 'SUPPLIER ID']],
      body: [[
        formatDateDisplay(voucher.date),
        voucher.referenceNo ? voucher.referenceNo.replace(/^PR-/, 'PRV-') : 'N/A',
        voucher.billNumber || 'N/A',
        voucher.supplier?._id || 'N/A',
      ]],
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 58, 94] },
    });
    let y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFillColor(34, 58, 94);
    doc.setTextColor('#fff');
    doc.rect(40, y, 220, 20, 'F');
    doc.text('BILL TO:', 45, y + 14);
    doc.setTextColor('#222');
    doc.setFontSize(10);
    doc.text(voucher.supplier?.name || 'N/A', 45, y + 34);
    doc.text(voucher.supplier?.address || 'N/A', 45, y + 48);
    doc.text(voucher.supplier?.pan || 'N/A', 45, y + 62);
    doc.text(voucher.supplier?.phoneNumber || 'N/A', 45, y + 76);
    const items = (voucher.items || []).map(item => [
      item.item?._id || 'N/A',
      item.item?.name || 'Unknown Product',
      item.quantity || 0,
      (item.price || 0).toFixed(2),
      ((item.quantity || 0) * (item.price || 0)).toFixed(2),
    ]);
    autoTable(doc, {
      startY: y + 90,
      head: [['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
      body: items,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 58, 94] },
    });
    let y2 = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('SUBTOTAL', 400, y2);
    doc.text((voucher.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2), 520, y2, { align: 'right' });
    doc.text('TAX RATE', 400, y2 + 16);
    doc.text('0.000%', 520, y2 + 16, { align: 'right' });
    doc.text('TAX', 400, y2 + 32);
    doc.text('0.00', 520, y2 + 32, { align: 'right' });
    doc.text('TOTAL', 400, y2 + 48);
    doc.setFontSize(14);
    doc.setTextColor('#3a5da8');
    doc.text((voucher.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2), 520, y2 + 48, { align: 'right' });
    doc.setTextColor('#222');
    doc.setFontSize(10);
    doc.text('Other Comments or Special Instructions:', 40, y2 + 80);
    doc.text('- Total payment due in 30 days', 60, y2 + 96);
    doc.text('- Please include the return voucher number on your check', 60, y2 + 110);
    doc.setFontSize(12);
    doc.setTextColor('#3a5da8');
    doc.text('Thank You For Your Business!', 40, y2 + 140);
    doc.setTextColor('#888');
    doc.setFontSize(10);
    doc.text('If you have any questions about this voucher, please contact', 40, y2 + 160);
    doc.text('[Name, Phone #, E-mail]', 40, y2 + 172);
    return doc.output('datauristring');
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
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by supplier, purchase return voucher no, bill no..."
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
              <CustomTableHead>PURCHASE RETURN VOUCHER NO</CustomTableHead>
              <CustomTableHead>PURCHASE RETURN BILL NO</CustomTableHead>
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
                <CustomTableCell>{voucher.referenceNo ? voucher.referenceNo.replace(/^PR-/, 'PRV-') : 'N/A'}</CustomTableCell>
                <CustomTableCell>{voucher.billNumber || 'N/A'}</CustomTableCell>
                <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                <CustomTableCell>{voucher.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                <CustomTableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={async e => {
                      e.stopPropagation();
                      setEmailVoucher(voucher);
                      const pdfUrl = await generatePdfBase64(voucher);
                      setPdfPreviewUrl(pdfUrl);
                      setEmailDialogOpen(true);
                    }} title="Email">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <PurchaseReturnExcelDownload purchaseReturn={voucher}>
                      <Button variant="outline" size="icon" title="Download Excel">
                        <FileSpreadsheet className="h-4 w-4 text-green-700" />
                      </Button>
                    </PurchaseReturnExcelDownload>
                    <PurchaseReturnPdfDownload purchaseReturn={voucher}>
                      <Button variant="outline" size="icon" title="Download PDF">
                        <FileText className="h-4 w-4 text-red-700" />
                      </Button>
                    </PurchaseReturnPdfDownload>
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
      </div>
      {emailDialogOpen && emailVoucher && (
        <EmailModal
          isOpen={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          to={emailVoucher.supplier?.email || ""}
          subject={`Purchase Return Voucher ${emailVoucher.referenceNo}`}
          body={`Please find attached the purchase return voucher for your reference.\n\n-- Sent from Cloud Ledger`}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`PurchaseReturnVoucher-${emailVoucher.referenceNo || emailVoucher._id}.pdf`}
          orderId={emailVoucher._id}
          type="purchase-return-voucher"
        />
      )}
    </div>
  );
} 
