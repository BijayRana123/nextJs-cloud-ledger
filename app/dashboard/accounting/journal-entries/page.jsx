"use client";

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from '@/components/ui/CustomTable';
import { Rocket, ChevronLeft, ChevronRight, X, Search, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fetcher = (url) => fetch(url).then((res) => res.json());

function generateJournalEntryPdf(entry) {
  if (!entry) return;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Journal Entry', 14, 22);
  doc.setFontSize(12);
  doc.text('Voucher No: ' + (entry.voucherNumber || entry._id), 14, 32);
  doc.text('Date: ' + (entry.datetime ? new Date(entry.datetime).toLocaleDateString() : 'N/A'), 14, 39);
  doc.text('Memo: ' + (entry.memo || ''), 14, 46);
  autoTable(doc, {
    startY: 60,
    head: [['Account', 'Debit', 'Credit']],
    body: (entry.transactions || []).map(txn => [
      (txn.account || (txn.account_path && txn.account_path.join(':')) || '-').split(':').pop(),
      txn.debit ? txn.amount : '',
      txn.credit ? txn.amount : ''
    ]),
    theme: 'striped',
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { cellPadding: 3, fontSize: 10, valign: 'middle', halign: 'center' },
    columnStyles: { 0: { halign: 'left' } }
  });
  doc.save(`JournalEntry-${entry.voucherNumber || entry._id}.pdf`);
}

function downloadJournalEntryExcel(entry) {
  if (!entry) return;
  const ws = XLSX.utils.json_to_sheet([
    {
      'Voucher No': entry.voucherNumber || entry._id,
      'Date': entry.datetime ? new Date(entry.datetime).toLocaleDateString() : 'N/A',
      'Memo': entry.memo || '',
    }
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'JournalEntry');
  XLSX.writeFile(wb, `JournalEntry-${entry.voucherNumber || entry._id}.xlsx`);
}

export default function JournalEntryListPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/accounting/journal-vouchers', fetcher, { refreshInterval: 10000 });
  const entries = data?.journalVouchers || [];

  // Helper to get voucher number
  const getVoucherNumber = (entry) => entry.referenceNo || entry.voucherNumber || entry._id;
  // Helper to get date
  const getDate = (entry) => entry.date || entry.datetime;
  // Helper to get amount (sum of debit transactions)
  const getAmount = (entry) => Array.isArray(entry.transactions) ? entry.transactions.filter(t => t.type === 'debit' || t.debit).reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0), 0) : 0;

  // State for search, pagination, and rows count
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsCount, setRowsCount] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and filter
  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const voucherNo = getVoucherNumber(entry) || '';
        const memo = entry.memo || '';
        return (
          searchQuery === "" ||
          (voucherNo && voucherNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (memo && memo.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
      .sort((a, b) => {
        // Sort by date descending first
        const dateA = getDate(a) ? new Date(getDate(a)).getTime() : 0;
        const dateB = getDate(b) ? new Date(getDate(b)).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        // If dates are equal, sort by voucher number descending (numeric part)
        const getNum = ref => {
          if (!ref) return 0;
          const match = ref.match(/\d+/g);
          return match ? parseInt(match.join(''), 10) : 0;
        };
        return getNum(getVoucherNumber(b)) - getNum(getVoucherNumber(a));
      });
  }, [entries, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / rowsCount);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * rowsCount, currentPage * rowsCount);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePrint = (id) => {
    window.open(`/dashboard/accounting/journal-entries/${id}/print`, '_blank');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Journal Entries</h1>
        <Link href="/dashboard/accounting/journal-entries/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
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
            <span className="text-sm text-gray-700">{(currentPage - 1) * rowsCount + 1} - {Math.min(currentPage * rowsCount, filteredEntries.length)} / {filteredEntries.length}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by voucher no, memo..."
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
              <CustomTableHead>VOUCHER NO</CustomTableHead>
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>MEMO</CustomTableHead>
              <CustomTableHead>AMOUNT</CustomTableHead>
              <CustomTableHead>ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {paginatedEntries.map((entry) => (
              <CustomTableRow key={entry._id} onClick={() => router.push(`/dashboard/accounting/journal-entries/${entry._id}`)} className="cursor-pointer hover:bg-gray-100">
                <CustomTableCell>{getVoucherNumber(entry)}</CustomTableCell>
                <CustomTableCell>{getDate(entry) ? new Date(getDate(entry)).toLocaleDateString() : 'N/A'}</CustomTableCell>
                <CustomTableCell>{entry.memo || ''}</CustomTableCell>
                <CustomTableCell>{getAmount(entry)}</CustomTableCell>
                <CustomTableCell>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(entry._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); downloadJournalEntryExcel(entry); }} title="Download Excel"><FileSpreadsheet className="h-4 w-4 text-green-700" /></Button>
                  <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); generateJournalEntryPdf(entry); }} title="Download PDF"><FileText className="h-4 w-4 text-red-700" /></Button>
                </CustomTableCell>
              </CustomTableRow>
            ))}
          </CustomTableBody>
        </CustomTable>
      </div>
    </div>
  );
} 