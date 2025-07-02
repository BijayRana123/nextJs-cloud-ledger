"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableRow,
  CustomTableHead,
  CustomTableCell
} from "@/components/ui/CustomTable";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Rocket, X, Search, Printer, Mail, FileSpreadsheet, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import EmailModal from "@/app/components/email-modal";
import { ConditionalDatePicker } from '../../../../components/ConditionalDatePicker';

const VOUCHER_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Journal Voucher', label: 'Journal Voucher' },
  { value: 'Contra Voucher', label: 'Contra Voucher' },
  { value: 'Sales Voucher', label: 'Sales Voucher' },
  { value: 'Sales Return Voucher', label: 'Sales Return Voucher' },
  { value: 'Purchase Voucher', label: 'Purchase Voucher' },
  { value: 'Purchase Return Voucher', label: 'Purchase Return Voucher' },
  { value: 'Payment Voucher', label: 'Payment Voucher' },
  { value: 'Receipt Voucher', label: 'Receipt Voucher' },
];

export default function DayBookPage() {
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const { isNepaliCalendar } = useCalendar();
  const [rowsCount, setRowsCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailEntry, setEmailEntry] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [voucherType, setVoucherType] = useState('all');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchDayBookEntries(currentPage, rowsCount, selectedAccount, startDate, endDate, voucherType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsCount, selectedAccount, startDate, endDate, voucherType]);

  // Fetch account list for dropdown
  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounting?action=balances");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (e) {
      setAccounts([]);
    }
  };

  // Fetch day book entries from the API
  const fetchDayBookEntries = async (page = 1, limit = 10, account = "", startDate = "", endDate = "", voucherType = "") => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (account) params.append('account', account);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (voucherType && voucherType !== 'all') params.append('voucherType', voucherType);
      const response = await fetch(`/api/accounting/day-books?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch day book entries");
      }
      const data = await response.json();
      setJournalEntries(data.dayBookEntries || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setCurrentPage(data.pagination.currentPage || 1);
        setTotalCount(data.pagination.totalCount || 0);
        setRowsCount(data.pagination.perPage || 10);
      }
    } catch (error) {
      setError("Failed to load day book entries. Please try again later.");
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // No client-side filtering: display all entries returned from the backend
  const flatEntries = Array.isArray(journalEntries)
    ? journalEntries.flatMap(group => group.entries.map(entry => ({ ...entry, groupDate: group.date })))
    : [];
  
  // Format date for display based on calendar type
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Always specify locale and options for deterministic output
      return formatDate(new Date(dateString), isNepaliCalendar, 'en');
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  // Calculate the total amount of a journal entry (sum of all transactions)
  const calculateTotalAmount = (entry) => {
    if (!entry || !entry.transactions || !Array.isArray(entry.transactions) || entry.transactions.length === 0) return 0;
    
    const totalDebit = entry.transactions
      .filter(t => t && t.debit)
      .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
      
    return totalDebit;
  };

  // Function to format the memo text to make it more readable
  const formatMemo = (memo) => {
    if (!memo) return "No description";
    return memo;
  };

  // Print, Email, Excel, PDF handlers (dummy for now, adapt as needed)
  const handlePrint = (id) => {
    window.open(`/dashboard/accounting/reports/day-book/${id}/print`, '_blank');
  };

  const handleDownloadExcel = (entry) => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Voucher Reference Number': entry.voucherNumber,
        'Type': getVoucherType(entry.voucherNumber),
        'Date': formatDateDisplay(entry.datetime),
        'Amount': calculateTotalAmount(entry).toFixed(2),
        'Memo': entry.memo || '',
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DayBookEntry');
    XLSX.writeFile(wb, `DayBookEntry-${entry.voucherNumber || entry._id}.xlsx`);
  };

  const handleDownloadPDF = async (entry) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Day Book Entry', 14, 22);
    doc.setFontSize(12);
    doc.text('Voucher Reference Number: ' + (entry.voucherNumber || entry._id), 14, 32);
    doc.text('Date: ' + (entry.datetime ? formatDateDisplay(entry.datetime) : 'N/A'), 14, 39);
    doc.text('Type: ' + getVoucherType(entry.voucherNumber), 14, 46);
    doc.text('Amount: $' + calculateTotalAmount(entry).toFixed(2), 14, 53);
    doc.text('Memo: ' + (entry.memo || ''), 14, 60);
    doc.save(`DayBookEntry-${entry.voucherNumber || entry._id}.pdf`);
  };

  // Utility to infer voucher type from voucherNumber prefix
  function getVoucherType(voucherNumber) {
    if (!voucherNumber) return "Unknown";
    if (voucherNumber.startsWith("JV-")) return "Journal Voucher";
    if (voucherNumber.startsWith("CV-")) return "Contra Voucher";
    if (voucherNumber.startsWith("SV-")) return "Sales Voucher";
    if (voucherNumber.startsWith("SR-")) return "Sales Return Voucher";
    if (voucherNumber.startsWith("PV-")) return "Purchase Voucher";
    if (voucherNumber.startsWith("PR-")) return "Purchase Return Voucher";
    if (voucherNumber.startsWith("PaV-")) return "Payment Voucher";
    if (voucherNumber.startsWith("RcV-")) return "Receipt Voucher";
    return "Other";
  }

  // Helper to find the original voucher's ID from the entry's transactions
  const getOriginalVoucherId = (entry) => {
    const fallbackId = entry._id; // Default to journal entry ID

    if (!entry.transactions || !Array.isArray(entry.transactions)) {
      return fallbackId;
    }

    // A list of all possible metadata ID keys, in a potential order of preference
    const idKeys = [
      'salesVoucherId',
      'purchaseOrderId',
      'paymentVoucherId',
      'receiptVoucherId',
      'journalVoucherId',
      'contraVoucherId',
      'salesReturnId',
      'salesReturnVoucherId',
      'purchaseReturnId',
      'purchaseReturnVoucherId',
      'purchaseVoucherId',
      'expenseVoucherId',
      'incomeVoucherId',
    ];

    // Iterate through each transaction to find the first matching ID
    for (const transaction of entry.transactions) {
      if (transaction.meta) {
        for (const key of idKeys) {
          if (transaction.meta[key]) {
            return transaction.meta[key]; // Return the first one we find
          }
        }
      }
    }
    
    return fallbackId; // Return fallback if no specific ID was found
  };

  if (loading) {
    return <div className="p-4">Loading day book entries...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  // Helper function to handle changing rows count
  const handleRowsChange = (value) => {
    const newRowsCount = Number(value);
    setRowsCount(newRowsCount);
    setCurrentPage(1); // Reset to first page
    // The useEffect will trigger a refetch
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Day Book</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Calendar:</span>{" "}
            <span className="bg-gray-100 px-2 py-1 rounded">
              {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-50 mb-4 items-end">
        <div>
          <ConditionalDatePicker
            id="startDate"
            name="startDate"
            label="Start Date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="w-[150px]"
          />
        </div>
        <div>
          <ConditionalDatePicker
            id="endDate"
            name="endDate"
            label="End Date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="w-[150px]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Voucher Type</label>
          <Select value={voucherType} onValueChange={val => { setVoucherType(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {VOUCHER_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Rows Count</span>
            <Select value={String(rowsCount)} onValueChange={handleRowsChange}>
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
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by memo, voucher number..."
          className="pl-10"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="border rounded-md">
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow className="bg-gray-100">
              <CustomTableHead>DATE</CustomTableHead>
              <CustomTableHead>VOUCHER REFERENCE NUMBER</CustomTableHead>
              <CustomTableHead>TYPE</CustomTableHead>
              <CustomTableHead>MEMO</CustomTableHead>
              <CustomTableHead className="text-right">AMOUNT</CustomTableHead>
              <CustomTableHead className="text-right">ACTIONS</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {flatEntries.map((entry) => {
              // Map voucher type to correct detail page
              const getVoucherDetailRoute = (type, id) => {
                switch (type) {
                  case "Sales Voucher": return `/dashboard/sales/sales-vouchers/${id}`;
                  case "Sales Return Voucher": return `/dashboard/sales/sales-return-vouchers/${id}`;
                  case "Purchase Voucher": return `/dashboard/purchase/purchase-orders/${id}`;
                  case "Purchase Return Voucher": return `/dashboard/purchase/purchase-return-vouchers/${id}`;
                  case "Payment Voucher": return `/dashboard/accounting/transactions/pay-supplier/${id}`;
                  case "Receipt Voucher": return `/dashboard/accounting/transactions/receive-payment/${id}`;
                  case "Journal Voucher": return `/dashboard/accounting/journal-entries/${id}`;
                  case "Contra Voucher": return `/dashboard/accounting/transactions/contra-voucher/${id}`;
                  case "Expense Voucher": return `/dashboard/accounting/transactions/record-expense/${id}`;
                  case "Income Voucher": return `/dashboard/accounting/transactions/record-income/${id}`;
                  default: return `/dashboard/accounting/reports/day-book/${id}`;
                }
              };
              const type = getVoucherType(entry.voucherNumber);
              // Use the new helper function to reliably get the original voucher ID
              const voucherId = getOriginalVoucherId(entry);
              const detailRoute = getVoucherDetailRoute(type, voucherId);
              return (
                <CustomTableRow
                  key={entry._id}
                  className="cursor-pointer"
                  onClick={e => {
                    if (
                      e.target.closest('button') ||
                      e.target.closest('input[type=checkbox]') ||
                      e.target.closest('.switch')
                    ) return;
                    router.push(detailRoute);
                  }}
                >
                  <CustomTableCell>{formatDateDisplay(entry.datetime)}</CustomTableCell>
                  <CustomTableCell>{entry.voucherNumber || "N/A"}</CustomTableCell>
                  <CustomTableCell>{type}</CustomTableCell>
                  <CustomTableCell>{formatMemo(entry.memo)}</CustomTableCell>
                  <CustomTableCell className="text-right">${calculateTotalAmount(entry).toFixed(2)}</CustomTableCell>
                  <CustomTableCell className="text-right">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handlePrint(entry._id); }} title="Print"><Printer className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={async e => {
                        e.stopPropagation();
                        setEmailEntry(entry);
                        setEmailDialogOpen(true);
                        // Generate PDF preview for the modal
                        // (You can implement PDF preview logic here if needed)
                      }} title="Email">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={e => { e.stopPropagation(); handleDownloadExcel(entry); }} title="Download Excel">
                        <FileSpreadsheet className="h-4 w-4 text-green-700" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={async e => { e.stopPropagation(); handleDownloadPDF(entry); }} title="Download PDF">
                        <FileText className="h-4 w-4 text-red-700" />
                      </Button>
                    </div>
                  </CustomTableCell>
                </CustomTableRow>
              );
            })}
            {flatEntries.length === 0 && (
              <CustomTableRow>
                <CustomTableCell colSpan={8} className="text-center py-4">
                  {searchTerm ? "No matching day book entries found." : "No day book entries found."}
                </CustomTableCell>
              </CustomTableRow>
            )}
          </CustomTableBody>
        </CustomTable>
      </div>
      {/* Email Modal */}
      {emailDialogOpen && emailEntry && (
        <EmailModal
          isOpen={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          to={""}
          subject={`Day Book Entry ${emailEntry.voucherNumber}`}
          body={`Please find attached the day book entry for your reference.\n\n-- Sent from Cloud Ledger`}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`DayBookEntry-${emailEntry.voucherNumber || emailEntry._id}.pdf`}
          orderId={emailEntry._id}
          type="day-book-entry"
        />
      )}
    </div>
  );
} 