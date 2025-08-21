"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from '@/components/ui/CustomTable';
import { Rocket, ChevronLeft, ChevronRight, X, Search, Printer, Mail, FileSpreadsheet, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';
import EmailModal from '@/components/email-modal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fetcher = (url, orgId) => 
  fetch(url, {
    headers: orgId ? { 'x-organization-id': orgId } : {}
  }).then((res) => res.json());

function generateReceiptVoucherPdf(voucher) {
  if (!voucher) return;
  const doc = new jsPDF();
  // Header
  doc.setFontSize(18);
  doc.text('Receipt Voucher', 14, 22);
  // Customer Info
  doc.setFontSize(12);
  doc.text('Customer Information', 14, 32);
  const customer = voucher.customer?.name || 'N/A';
  doc.text(`Name: ${customer}`, 14, 39);
  // Voucher Info
  doc.text(`Voucher No: ${voucher.receiptVoucherNumber || 'N/A'}`, 150, 32);
  doc.text(`Date: ${voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}`, 150, 39);
  doc.text(`Payment Method: ${voucher.paymentMethod || 'N/A'}`, 150, 46);
  // Amount
  doc.setFontSize(14);
  doc.text('Amount:', 14, 70);
  doc.text(`${voucher.amount?.toFixed(2) || '0.00'}`, 50, 70);
  // Notes
  if (voucher.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, 80);
    doc.text(voucher.notes, 14, 87, { maxWidth: 180 });
  }
  doc.save(`ReceiptVoucher-${voucher.receiptVoucherNumber || voucher._id}.pdf`);
}

function generateReceiptVoucherPdfBase64(voucher) {
  if (!voucher) return '';
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Receipt Voucher', 14, 22);
  doc.setFontSize(12);
  doc.text('Customer Information', 14, 32);
  const customer = voucher.customer?.name || 'N/A';
  doc.text(`Name: ${customer}`, 14, 39);
  doc.text(`Voucher No: ${voucher.receiptVoucherNumber || 'N/A'}`, 150, 32);
  doc.text(`Date: ${voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}`, 150, 39);
  doc.text(`Payment Method: ${voucher.paymentMethod || 'N/A'}`, 150, 46);
  doc.setFontSize(14);
  doc.text('Amount:', 14, 70);
  doc.text(`${voucher.amount?.toFixed(2) || '0.00'}`, 50, 70);
  if (voucher.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, 80);
    doc.text(voucher.notes, 14, 87, { maxWidth: 180 });
  }
  return doc.output('datauristring');
}

function downloadReceiptVoucherExcel(voucher) {
  if (!voucher) return;
  const ws = XLSX.utils.json_to_sheet([
    {
      'Receipt Voucher No': voucher.receiptVoucherNumber,
      'Customer': voucher.customer?.name || 'N/A',
      'Date': voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A',
      'Payment Method': voucher.paymentMethod || 'N/A',
      'Amount': voucher.amount?.toFixed(2) || '0.00',
      'Notes': voucher.notes || ''
    }
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ReceiptVoucher');
  XLSX.writeFile(wb, `ReceiptVoucher-${voucher.receiptVoucherNumber || voucher._id}.xlsx`);
}

export default function ReceiptVoucherListPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  
  const { data, error, isLoading } = useSWR(
    currentOrganization?._id 
      ? ['/api/organization/receipt-vouchers', currentOrganization._id]
      : null,
    ([url, orgId]) => fetcher(url, orgId),
    { refreshInterval: 10000 }
  );
  const vouchers = data?.receiptVouchers || [];

  // State for search, pagination, and rows count
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsCount, setRowsCount] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailVoucher, setEmailVoucher] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

  // Search and filter
  const filteredVouchers = useMemo(() => {
    return vouchers
      .filter(voucher => {
        const customer = voucher.customer?.name || '';
        const voucherNo = voucher.receiptVoucherNumber || '';
        const amount = voucher.amount || '';
        return (
          searchQuery === "" ||
          (customer && customer.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (voucherNo && voucherNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (amount && amount.toString().includes(searchQuery.toLowerCase()))
        );
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
        return getNum(b.receiptVoucherNumber) - getNum(a.receiptVoucherNumber);
      });
  }, [vouchers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / rowsCount);
  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * rowsCount, currentPage * rowsCount);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/accounting/transactions/receive-payment/${id}/print`, '_blank');
  };

  // Show loading state if organization is not loaded yet
  if (!currentOrganization) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading organization...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receipt Vouchers</h1>
        <Link href="/dashboard/accounting/transactions/receive-payment/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
          <Rocket className="h-5 w-5 mr-2" />
          ADD NEW
        </Link>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Rows Count</span>
            <Select value={rowsCount.toString()} onValueChange={val => { setRowsCount(Number(val)); setCurrentPage(1); }}>
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
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-gray-700">{(currentPage - 1) * rowsCount + 1} - {Math.min(currentPage * rowsCount, filteredVouchers.length)} / {filteredVouchers.length}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by customer, receipt voucher no..."
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
              <CustomTableHead>CUSTOMER</CustomTableHead>
              <CustomTableHead>RECEIPT VOUCHER NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>AMOUNT</CustomTableHead>
              <CustomTableHead>PAYMENT METHOD</CustomTableHead>
              <CustomTableHead>ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {paginatedVouchers.map((voucher) => {
              const customer = voucher.customer?.name || '';
              const receiptVoucherNumber = voucher.receiptVoucherNumber || '';
              const amount = voucher.amount || '';
              const paymentMethod = voucher.paymentMethod || '';
              return (
                <CustomTableRow
                  key={voucher._id}
                  className={"cursor-pointer"}
                  onClick={e => {
                    if (
                      e.target.closest('button') ||
                      e.target.closest('input[type=checkbox]') ||
                      e.target.closest('.switch')
                    ) return;
                    router.push(`/dashboard/accounting/transactions/receive-payment/${voucher._id}`);
                  }}
                >
                  <CustomTableCell>{customer}</CustomTableCell>
                  <CustomTableCell>{receiptVoucherNumber}</CustomTableCell>
                  <CustomTableCell>{voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}</CustomTableCell>
                  <CustomTableCell>{amount}</CustomTableCell>
                  <CustomTableCell>{paymentMethod}</CustomTableCell>
                  <CustomTableCell>
                    <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={async e => { e.stopPropagation(); setEmailVoucher(voucher); const pdfUrl = await generateReceiptVoucherPdfBase64(voucher); setPdfPreviewUrl(pdfUrl); setEmailDialogOpen(true); }} title="Email"><Mail className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); downloadReceiptVoucherExcel(voucher); }} title="Download Excel"><FileSpreadsheet className="h-4 w-4 text-green-700" /></Button>
                    <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); generateReceiptVoucherPdf(voucher); }} title="Download PDF"><FileText className="h-4 w-4 text-red-700" /></Button>
                  </CustomTableCell>
                </CustomTableRow>
              );
            })}
          </CustomTableBody>
        </CustomTable>
      </div>
      {emailDialogOpen && emailVoucher && (
        <EmailModal
          isOpen={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          to={emailVoucher.transactions?.find(t => t.meta?.customerEmail)?.meta?.customerEmail || ""}
          subject={`Receipt Voucher ${emailVoucher.voucherNumber}`}
          body={`Please find attached the receipt voucher for your reference.\n\n-- Sent from Cloud Ledger`}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`ReceiptVoucher-${emailVoucher.voucherNumber || emailVoucher._id}.pdf`}
          orderId={emailVoucher._id}
          type="receipt-voucher"
        />
      )}
    </div>
  );
}
