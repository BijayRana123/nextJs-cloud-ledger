"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from '@/components/ui/CustomTable';
import { Rocket, ChevronLeft, ChevronRight, X, Search, Printer, Mail, FileSpreadsheet, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import EmailModal from '@/components/email-modal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fetcher = (url, orgId) => 
  fetch(url, {
    headers: orgId ? { 'x-organization-id': orgId } : {}
  }).then((res) => res.json());

function generateContraVoucherPdf(voucher) {
  if (!voucher) return;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Contra Voucher', 14, 22);
  doc.setFontSize(12);
  doc.text('Voucher No: ' + (voucher.referenceNo || 'N/A'), 14, 32);
  doc.text('Date: ' + (voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'), 14, 39);
  doc.text('From Account: ' + (voucher.fromAccount?.split(':').pop() || 'N/A'), 14, 46);
  doc.text('To Account: ' + (voucher.toAccount?.split(':').pop() || 'N/A'), 14, 53);
  doc.text('Amount: ' + (voucher.amount || 'N/A'), 14, 60);
  doc.text('Notes: ' + (voucher.notes || ''), 14, 67);
  autoTable(doc, {
    startY: 80,
    head: [['Account', 'Amount', 'Type']],
    body: [
      [voucher.fromAccount?.split(':').pop() || 'N/A', voucher.amount, 'Credit'],
      [voucher.toAccount?.split(':').pop() || 'N/A', voucher.amount, 'Debit'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { cellPadding: 3, fontSize: 10, valign: 'middle', halign: 'center' },
    columnStyles: { 0: { halign: 'left' } }
  });
  doc.save(`ContraVoucher-${voucher.referenceNo || voucher._id}.pdf`);
}

function downloadContraVoucherExcel(voucher) {
  if (!voucher) return;
  const ws = XLSX.utils.json_to_sheet([
    {
      'Contra Voucher No': voucher.referenceNo,
      'Date': voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A',
      'From Account': voucher.fromAccount?.split(':').pop() || 'N/A',
      'To Account': voucher.toAccount?.split(':').pop() || 'N/A',
      'Amount': voucher.amount,
      'Notes': voucher.notes || '',
    }
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ContraVoucher');
  XLSX.writeFile(wb, `ContraVoucher-${voucher.referenceNo || voucher._id}.xlsx`);
}

export default function ContraVoucherListPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  
  const { data, error, isLoading } = useSWR(
    currentOrganization?._id 
      ? ['/api/accounting/vouchers/contra', currentOrganization._id]
      : null,
    ([url, orgId]) => fetcher(url, orgId),
    { refreshInterval: 10000 }
  );
  const vouchers = data?.contraVouchers || [];

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
        const voucherNo = voucher.referenceNo || '';
        const fromAccount = voucher.fromAccount?.split(':').pop() || '';
        const toAccount = voucher.toAccount?.split(':').pop() || '';
        const amount = voucher.amount || '';
        return (
          searchQuery === "" ||
          (voucherNo && voucherNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (fromAccount && fromAccount.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (toAccount && toAccount.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
        return getNum(b.referenceNo) - getNum(a.referenceNo);
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
    window.open(`/dashboard/accounting/transactions/contra-voucher/${id}/print`, '_blank');
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
        <h1 className="text-2xl font-bold">Contra Vouchers</h1>
        <Link href="/dashboard/accounting/transactions/contra-voucher/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
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
          placeholder="Search by contra voucher no, from/to account..."
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
              <CustomTableHead>CONTRA VOUCHER NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>FROM ACCOUNT</CustomTableHead>
              <CustomTableHead>TO ACCOUNT</CustomTableHead>
              <CustomTableHead>AMOUNT</CustomTableHead>
              <CustomTableHead>ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {paginatedVouchers.map((voucher) => (
              <CustomTableRow key={voucher._id} onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${voucher._id}`)} className="cursor-pointer hover:bg-gray-100">
                <CustomTableCell>{voucher.referenceNo || ''}</CustomTableCell>
                <CustomTableCell>{voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}</CustomTableCell>
                <CustomTableCell>{voucher.fromAccount?.split(':').pop() || ''}</CustomTableCell>
                <CustomTableCell>{voucher.toAccount?.split(':').pop() || ''}</CustomTableCell>
                <CustomTableCell>{voucher.amount}</CustomTableCell>
                <CustomTableCell>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(voucher._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); downloadContraVoucherExcel(voucher); }} title="Download Excel"><FileSpreadsheet className="h-4 w-4 text-green-700" /></Button>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); generateContraVoucherPdf(voucher); }} title="Download PDF"><FileText className="h-4 w-4 text-red-700" /></Button>
                </CustomTableCell>
              </CustomTableRow>
            ))}
          </CustomTableBody>
        </CustomTable>
      </div>
      {/* Email Modal placeholder */}
      {/* <EmailModal open={emailDialogOpen} onOpenChange={setEmailDialogOpen} voucher={emailVoucher} pdfPreviewUrl={pdfPreviewUrl} /> */}
    </div>
  );
} 
