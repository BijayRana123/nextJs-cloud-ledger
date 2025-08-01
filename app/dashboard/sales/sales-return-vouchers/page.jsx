"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, ChevronLeft, ChevronRight, Menu, Rocket, Check, X, Search, FileEdit, Trash2, Printer, Mail, FileSpreadsheet, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import EmailModal from "@/components/email-modal";

export default function SalesReturnVouchersPage() {
  const [salesReturnVouchers, setSalesReturnVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailOrder, setEmailOrder] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

  const fetchSalesReturnVouchers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization/sales-return-vouchers');
      const result = await response.json();
      if (response.ok) {
        setSalesReturnVouchers(result.salesReturnVouchers || []);
      } else {
        setError(result.message || "Failed to fetch sales return vouchers");
      }
    } catch (err) {
      console.error("Error fetching sales return vouchers:", err);
      setError("An error occurred while fetching the sales return vouchers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturnVouchers();
  }, []);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDate(new Date(dateString), isNepaliCalendar);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredVouchers = salesReturnVouchers
    .filter(voucher => {
    const searchMatches = searchQuery === "" ||
      (voucher.customer?.name && voucher.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.salesReturnNumber && voucher.salesReturnNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.referenceNo && voucher.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voucher.totalAmount && voucher.totalAmount.toString().includes(searchQuery.toLowerCase()));
      return searchMatches;
    })
    .sort((a, b) => {
      const getNum = ref => {
        if (!ref) return 0;
        const match = ref.match(/\d+/g);
        return match ? parseInt(match.join(''), 10) : 0;
      };
      return getNum(b.referenceNo) - getNum(a.referenceNo);
  });

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
        setSalesReturnVouchers(prev => prev.filter(v => v._id !== deletingId));
        setDeleteDialogOpen(false);
        setDeletingId(null);
        toast({ title: 'Deleted', description: 'Sales return voucher deleted successfully', variant: 'success' });
      } else {
        toast({ title: 'Delete Failed', description: 'Failed to delete sales return voucher', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An error occurred while deleting sales return voucher', variant: 'destructive' });
    }
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/sales/sales-return-vouchers/${id}/print`, '_blank');
  };

  // Helper to generate PDF as base64 for preview/attachment
  const generatePdfBase64 = async (order) => {
    const jsPDFModule = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDFModule.jsPDF('p', 'pt');
    // Company Info (placeholder)
    doc.setFontSize(18);
    doc.text('[Company Name]', 40, 40);
    doc.setFontSize(10);
    doc.text('[Street Address]', 40, 60);
    doc.text('[City, ST ZIP]', 40, 75);
    doc.text('Phone: [000-000-0000]', 40, 90);
    doc.text('Fax: [000-000-0000]', 40, 105);
    // Invoice Title
    doc.setFontSize(24);
    doc.setTextColor('#3a5da8');
    doc.text('INVOICE', 420, 50, { align: 'right' });
    doc.setTextColor('#222');
    doc.setFontSize(12);
    // Invoice Info Table
    autoTable(doc, {
      startY: 120,
      head: [['DATE', 'SALES RETURN VOUCHER NO', 'CUSTOMER ID']],
      body: [[
        formatDateDisplay(order.date),
        order.referenceNo || 'N/A',
        order.customer?._id || 'N/A',
      ]],
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 58, 94] },
    });
    // Customer Info
    let y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFillColor(34, 58, 94);
    doc.setTextColor('#fff');
    doc.rect(40, y, 220, 20, 'F');
    doc.text('BILL TO:', 45, y + 14);
    doc.rect(300, y, 220, 20, 'F');
    doc.text('SHIP TO:', 305, y + 14);
    doc.setTextColor('#222');
    doc.setFontSize(10);
    doc.text('[Name]', 45, y + 34);
    doc.text('[Company Name]', 45, y + 48);
    doc.text('[Street Address]', 45, y + 62);
    doc.text('[City, ST ZIP]', 45, y + 76);
    doc.text('[Phone]', 45, y + 90);
    doc.text('[Name]', 305, y + 34);
    doc.text('[Company Name]', 305, y + 48);
    doc.text('[Street Address]', 305, y + 62);
    doc.text('[City, ST ZIP]', 305, y + 76);
    doc.text('[Phone]', 305, y + 90);
    // Items Table
    const items = (order.items || []).map(item => [
      item.item?._id || 'N/A',
      item.item?.name || 'Unknown Product',
      item.quantity || 0,
      (item.price || 0).toFixed(2),
      ((item.quantity || 0) * (item.price || 0)).toFixed(2),
    ]);
    autoTable(doc, {
      startY: y + 110,
      head: [['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
      body: items,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 58, 94] },
    });
    // Totals
    let y2 = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('SUBTOTAL', 400, y2);
    doc.text((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2), 520, y2, { align: 'right' });
    doc.text('TAX RATE', 400, y2 + 16);
    doc.text('6.750%', 520, y2 + 16, { align: 'right' });
    doc.text('TAX', 400, y2 + 32);
    doc.text(((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 0.0675).toFixed(2), 520, y2 + 32, { align: 'right' });
    doc.text('TOTAL', 400, y2 + 48);
    doc.setFontSize(14);
    doc.setTextColor('#3a5da8');
    doc.text(((order.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 1.0675).toFixed(2), 520, y2 + 48, { align: 'right' });
    doc.setTextColor('#222');
    // Comments
    doc.setFontSize(10);
    doc.text('Other Comments or Special Instructions:', 40, y2 + 80);
    doc.text('- Total payment due in 30 days', 60, y2 + 96);
    doc.text('- Please include the invoice number on your check', 60, y2 + 110);
    // Footer
    doc.setFontSize(12);
    doc.setTextColor('#3a5da8');
    doc.text('Thank You For Your Business!', 40, y2 + 140);
    doc.setTextColor('#888');
    doc.setFontSize(10);
    doc.text('If you have any questions about this invoice, please contact', 40, y2 + 160);
    doc.text('[Name, Phone #, E-mail]', 40, y2 + 172);
    // Return as base64 string
    return doc.output('datauristring');
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
              <span className="text-sm text-gray-700">1 - {filteredVouchers.length} / {filteredVouchers.length}</span>
              <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
       
      </div>
      <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by customer, sales return voucher no..."
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
      <div className="rounded-md border">
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead>CUSTOMER</CustomTableHead>
              <CustomTableHead>SALES RETURN VOUCHER NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead className="text-right">AMOUNT</CustomTableHead>
              <CustomTableHead className="text-right">ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher) => (
                <CustomTableRow 
                  key={voucher._id}
                  className={(voucher.highlighted ? "bg-green-50 " : "") + " cursor-pointer"}
                  onClick={e => {
                    if (
                      e.target.closest('button') ||
                      e.target.closest('input[type=checkbox]') ||
                      e.target.closest('.switch')
                    ) return;
                    router.push(`/dashboard/sales/sales-return-vouchers/${voucher._id}`);
                  }}
                >
                  <CustomTableCell>{voucher.customer?.name || voucher.customer || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{voucher.referenceNo || 'N/A'}</CustomTableCell>
                  <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                  <CustomTableCell className="text-right">{voucher.totalAmount?.toFixed(2) || '0.00'}</CustomTableCell>
                  <CustomTableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={async e => {
                        e.stopPropagation();
                        setEmailOrder(voucher);
                        setEmailDialogOpen(true);
                        // Generate PDF preview for the modal
                        const pdfUrl = await generatePdfBase64(voucher);
                        setPdfPreviewUrl(pdfUrl);
                      }} title="Email">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={e => {
                        e.stopPropagation();
                        // Prepare data for Excel
                        const ws = XLSX.utils.json_to_sheet([
                          {
                            'Sales Return Voucher No': voucher.referenceNo,
                            'Customer': voucher.customer?.name || 'N/A',
                            'Date': formatDateDisplay(voucher.date),
                            'Amount': voucher.totalAmount?.toFixed(2) || '0.00',
                          }
                        ]);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'SalesReturnVoucher');
                        XLSX.writeFile(wb, `SalesReturnVoucher-${voucher.referenceNo || voucher._id}.xlsx`);
                      }} title="Download Excel">
                        <FileSpreadsheet className="h-4 w-4 text-green-700" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={async e => {
                        e.stopPropagation();
                        // Dynamically import autotable and attach to jsPDF
                        const jsPDFModule = await import('jspdf');
                        const autoTable = (await import('jspdf-autotable')).default;
                        const doc = new jsPDFModule.jsPDF('p', 'pt');
                        // Company Info (placeholder)
                        doc.setFontSize(18);
                        doc.text('[Company Name]', 40, 40);
                        doc.setFontSize(10);
                        doc.text('[Street Address]', 40, 60);
                        doc.text('[City, ST ZIP]', 40, 75);
                        doc.text('Phone: [000-000-0000]', 40, 90);
                        doc.text('Fax: [000-000-0000]', 40, 105);
                        // Invoice Title
                        doc.setFontSize(24);
                        doc.setTextColor('#3a5da8');
                        doc.text('SALES RETURN', 420, 50, { align: 'right' });
                        doc.setTextColor('#222');
                        doc.setFontSize(12);
                        // Invoice Info Table
                        autoTable(doc, {
                          startY: 120,
                          head: [['DATE', 'SALES RETURN VOUCHER NO', 'CUSTOMER ID']],
                          body: [[
                            formatDateDisplay(voucher.date),
                            voucher.referenceNo || 'N/A',
                            voucher.customer?._id || 'N/A',
                          ]],
                          theme: 'grid',
                          styles: { fontSize: 10 },
                          headStyles: { fillColor: [34, 58, 94] },
                        });
                        // Customer Info
                        let y = doc.lastAutoTable.finalY + 20;
                        doc.setFontSize(12);
                        doc.setFillColor(34, 58, 94);
                        doc.setTextColor('#fff');
                        doc.rect(40, y, 220, 20, 'F');
                        doc.text('BILL TO:', 45, y + 14);
                        doc.rect(300, y, 220, 20, 'F');
                        doc.text('SHIP TO:', 305, y + 14);
                        doc.setTextColor('#222');
                        doc.setFontSize(10);
                        doc.text('[Name]', 45, y + 34);
                        doc.text('[Company Name]', 45, y + 48);
                        doc.text('[Street Address]', 45, y + 62);
                        doc.text('[City, ST ZIP]', 45, y + 76);
                        doc.text('[Phone]', 45, y + 90);
                        doc.text('[Name]', 305, y + 34);
                        doc.text('[Company Name]', 305, y + 48);
                        doc.text('[Street Address]', 305, y + 62);
                        doc.text('[City, ST ZIP]', 305, y + 76);
                        doc.text('[Phone]', 305, y + 90);
                        // Items Table
                        const items = (voucher.items || []).map(item => [
                          item.item?._id || 'N/A',
                          item.item?.name || 'Unknown Product',
                          item.quantity || 0,
                          (item.price || 0).toFixed(2),
                          ((item.quantity || 0) * (item.price || 0)).toFixed(2),
                        ]);
                        autoTable(doc, {
                          startY: y + 110,
                          head: [['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
                          body: items,
                          theme: 'grid',
                          styles: { fontSize: 10 },
                          headStyles: { fillColor: [34, 58, 94] },
                        });
                        // Totals
                        let y2 = doc.lastAutoTable.finalY + 20;
                        doc.setFontSize(12);
                        doc.text('SUBTOTAL', 400, y2);
                        doc.text((voucher.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0).toFixed(2), 520, y2, { align: 'right' });
                        doc.text('TAX RATE', 400, y2 + 16);
                        doc.text('6.750%', 520, y2 + 16, { align: 'right' });
                        doc.text('TAX', 400, y2 + 32);
                        doc.text(((voucher.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 0.0675).toFixed(2), 520, y2 + 32, { align: 'right' });
                        doc.text('TOTAL', 400, y2 + 48);
                        doc.setFontSize(14);
                        doc.setTextColor('#3a5da8');
                        doc.text(((voucher.items || []).reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0) * 1.0675).toFixed(2), 520, y2 + 48, { align: 'right' });
                        doc.setTextColor('#222');
                        // Comments
                        doc.setFontSize(10);
                        doc.text('Other Comments or Special Instructions:', 40, y2 + 80);
                        doc.text('- Total payment due in 30 days', 60, y2 + 96);
                        doc.text('- Please include the invoice number on your check', 60, y2 + 110);
                        // Footer
                        doc.setFontSize(12);
                        doc.setTextColor('#3a5da8');
                        doc.text('Thank You For Your Business!', 40, y2 + 140);
                        doc.setTextColor('#888');
                        doc.setFontSize(10);
                        doc.text('If you have any questions about this invoice, please contact', 40, y2 + 160);
                        doc.text('[Name, Phone #, E-mail]', 40, y2 + 172);
                        doc.save(`SalesReturnVoucher-${voucher.referenceNo || voucher._id}.pdf`);
                      }} title="Download PDF">
                        <FileText className="h-4 w-4 text-red-700" />
                      </Button>
                    </div>
                  </CustomTableCell>
                </CustomTableRow>
              ))
            ) : (
              <CustomTableRow>
                <CustomTableCell colSpan={6} className="text-center">
                  {searchQuery ? "No matching sales return vouchers found." : "No sales return vouchers found."}
                </CustomTableCell>
              </CustomTableRow>
            )}
          </CustomTableBody>
        </CustomTable>
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sales return voucher? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {emailDialogOpen && emailOrder && (
        <EmailModal
          isOpen={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          to={emailOrder.customer?.email || ""}
          subject={`Sales Return Voucher ${emailOrder.referenceNo}`}
          body={`Please find attached the sales return voucher for your reference.\n\n-- Sent from Cloud Ledger`}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`SalesReturnVoucher-${emailOrder.referenceNo || emailOrder._id}.pdf`}
          orderId={emailOrder._id}
          type="sales-return-voucher"
        />
      )}
    </div>
  );
}
