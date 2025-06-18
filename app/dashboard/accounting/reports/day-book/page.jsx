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
import { CustomTableCell, CustomTableRow } from "@/components/ui/CustomTable";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function DayBookPage() {
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const { isNepaliCalendar } = useCalendar();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchDayBookEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

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
  const fetchDayBookEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = "/api/accounting/day-books";
      const params = [];
      if (selectedAccount) params.push(`account=${encodeURIComponent(selectedAccount)}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch day book entries");
      }
      const data = await response.json();
      if (Array.isArray(data.dayBookEntries)) {
        setJournalEntries(data.dayBookEntries);
      } else if (data.dayBookEntries) {
        setJournalEntries(Array.isArray(data.dayBookEntries) ? data.dayBookEntries : []);
      } else {
        setJournalEntries([]);
      }
    } catch (error) {
      setError("Failed to load day book entries. Please try again later.");
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter day book entries based on search term
  
  const filteredEntries = Array.isArray(journalEntries)
    ? journalEntries.map(group => ({
        ...group,
        entries: group.entries.filter(entry => {
          if (!entry || !entry.memo || !entry._id) return false;
          const matchesSearch =
            entry.memo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry._id.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        })
      })).filter(group => group.entries.length > 0)
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Day Book</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Day Book Entries</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Calendar:</span>{" "}
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {isNepaliCalendar ? "Nepali (BS)" : "English (AD)"}
                </span>
              </div>
              <Select value={selectedAccount} onValueChange={val => setSelectedAccount(val === 'all' ? '' : val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.path} value={acc.path}>
                      {acc.name} ({acc.path})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search day book entries..."
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading day book entries...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-40 text-red-500">
              <p>{error}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>No day book entries found.</p>
            </div>
          ) : (
            filteredEntries.map(group => (
              <div key={group.date} className="mb-8">
                <h2 className="text-xl font-semibold mb-2">{formatDateDisplay(group.date)}</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Memo</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.entries.map((entry) => (
                      <CustomTableRow key={entry._id}>
                        <CustomTableCell>{formatDateDisplay(entry.datetime)}</CustomTableCell>
                        <CustomTableCell>{entry._id ? entry._id.substring(0, 8) + "..." : "N/A"}</CustomTableCell>
                        <CustomTableCell>{formatMemo(entry.memo)}</CustomTableCell>
                        <CustomTableCell className="text-right">
                          ${calculateTotalAmount(entry).toFixed(2)}
                        </CustomTableCell>
                        <CustomTableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/accounting/reports/day-book/${entry._id}`)}
                          >
                            View
                          </Button>
                        </CustomTableCell>
                      </CustomTableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
} 