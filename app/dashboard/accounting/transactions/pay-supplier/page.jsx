"use client";

import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Rocket, ChevronLeft, ChevronRight, X, Search, Printer, Mail, FileSpreadsheet, FileText } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { useRouter } from "next/navigation";
import EmailModal from "@/app/components/email-modal";
import PaymentVoucherPdfDownload from "@/components/accounting/PaymentVoucherPdfDownload";
import PaymentVoucherExcelDownload from "@/components/accounting/PaymentVoucherExcelDownload";

export default function PaymentVouchersPage() {
  const [paymentVouchers, setPaymentVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const router = useRouter();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailVoucher, setEmailVoucher] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

  const fetchPaymentVouchers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization/payment-vouchers');
      const result = await response.json();
      if (response.ok) {
        setPaymentVouchers(result.paymentVouchers || result.paymentVoucher || []);
      } else {
        setError(result.message || "Failed to fetch payment vouchers");
      }
    } catch (err) {
      setError("An error occurred while fetching the payment vouchers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentVouchers();
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

  const filteredVouchers = paymentVouchers
    .filter(voucher => {
      const searchMatches = searchQuery === "" ||
        (voucher.supplier?.name && voucher.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voucher.paymentVoucherNumber && voucher.paymentVoucherNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (voucher.amount && voucher.amount.toString().includes(searchQuery.toLowerCase()));
      return searchMatches;
    })
    .sort((a, b) => {
      // Sort by date descending first
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      // If dates are equal, sort by voucher number descending (numeric part)
      const getNum = ref => {
        if (!ref) return 0;
        const match = ref.match(/\d+/g);
        return match ? parseInt(match.join(''), 10) : 0;
      };
      return getNum(b.paymentVoucherNumber) - getNum(a.paymentVoucherNumber);
    });

  const handlePrint = (id) => {
    window.open(`/dashboard/accounting/transactions/pay-supplier/${id}/print`, '_blank');
  };

  // Generate PDF preview for email modal
  const generatePdfBase64 = async (voucher) => {
    const jsPDFModule = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDFModule.jsPDF('p', 'pt');
    doc.setFontSize(18);
    doc.text('Payment Voucher', 40, 40);
    doc.setFontSize(10);
    doc.text('Supplier:', 40, 60);
    doc.text(voucher.supplier?.name || voucher.supplierName || 'N/A', 100, 60);
    doc.text('Voucher No:', 40, 75);
    doc.text(voucher.paymentVoucherNumber || 'N/A', 120, 75);
    doc.text('Date:', 40, 90);
    doc.text(formatDateDisplay(voucher.date), 80, 90);
    doc.text('Payment Method:', 40, 105);
    doc.text(voucher.paymentMethod || 'N/A', 140, 105);
    doc.text('Amount:', 40, 120);
    doc.text((voucher.amount?.toFixed(2) || '0.00').toString(), 100, 120);
    if (voucher.notes) {
      doc.text('Notes:', 40, 135);
      doc.text(voucher.notes, 100, 135, { maxWidth: 300 });
    }
    return doc.output('datauristring');
  };

  if (isLoading) {
    return <div className="p-4">Loading payment vouchers...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Vouchers</h1>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard/accounting/transactions/pay-supplier/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
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
          placeholder="Search by supplier, payment voucher no..."
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
              <CustomTableHead>PAYMENT VOUCHER NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>AMOUNT</CustomTableHead>
              <CustomTableHead>PAYMENT METHOD</CustomTableHead>
              <CustomTableHead>ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {filteredVouchers.map((voucher) => (
              <CustomTableRow
                key={voucher._id}
                className={"cursor-pointer"}
                onClick={e => {
                  if (
                    e.target.closest('button') ||
                    e.target.closest('input[type=checkbox]') ||
                    e.target.closest('.switch')
                  ) return;
                  router.push(`/dashboard/accounting/transactions/pay-supplier/${voucher._id}`);
                }}
              >
                <CustomTableCell>{voucher.supplier?.name || voucher.supplierName || 'N/A'}</CustomTableCell>
                <CustomTableCell>{voucher.paymentVoucherNumber || 'N/A'}</CustomTableCell>
                <CustomTableCell>{formatDateDisplay(voucher.date)}</CustomTableCell>
                <CustomTableCell>{voucher.amount?.toFixed(2) || '0.00'}</CustomTableCell>
                <CustomTableCell>{voucher.paymentMethod || 'N/A'}</CustomTableCell>
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
                    <PaymentVoucherExcelDownload paymentVoucher={voucher}>
                      <Button variant="outline" size="icon" title="Download Excel">
                        <FileSpreadsheet className="h-4 w-4 text-green-700" />
                      </Button>
                    </PaymentVoucherExcelDownload>
                    <PaymentVoucherPdfDownload paymentVoucher={voucher}>
                      <Button variant="outline" size="icon" title="Download PDF">
                        <FileText className="h-4 w-4 text-red-700" />
                      </Button>
                    </PaymentVoucherPdfDownload>
                  </div>
                </CustomTableCell>
              </CustomTableRow>
            ))}
            {filteredVouchers.length === 0 && (
              <CustomTableRow>
                <CustomTableCell colSpan={8} className="text-center py-4">
                  {searchQuery ? "No matching payment vouchers found." : "No payment vouchers found."}
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
          subject={`Payment Voucher ${emailVoucher.paymentVoucherNumber}`}
          body={`Please find attached the payment voucher for your reference.\n\n-- Sent from Cloud Ledger`}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`PaymentVoucher-${emailVoucher.paymentVoucherNumber || emailVoucher._id}.pdf`}
          orderId={emailVoucher._id}
          type="payment-voucher"
        />
      )}
    </div>
  );
}
