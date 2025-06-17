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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomTableCell, CustomTableRow } from "@/components/ui/CustomTable";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";

export default function JournalEntriesPage() {
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const { isNepaliCalendar } = useCalendar();

  useEffect(() => {
    // Fetch journal entries from the API
    fetchJournalEntries();
  }, []);

  // Fetch journal entries from the API
  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/accounting/journal-entries");
      
      if (!response.ok) {
        throw new Error("Failed to fetch journal entries");
      }
      
      const data = await response.json();
      
      // Ensure journalEntries is an array, even if the API returns unexpected data
      if (Array.isArray(data.journalEntries)) {
        setJournalEntries(data.journalEntries);
      } else if (data.journalEntries) {
        console.warn("API returned journalEntries in unexpected format:", data.journalEntries);
        // Try to convert to array if possible, otherwise use empty array
        setJournalEntries(Array.isArray(data.journalEntries) ? data.journalEntries : []);
      } else {
        console.warn("No journalEntries found in API response:", data);
        setJournalEntries([]);
      }
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      setError("Failed to load journal entries. Please try again later.");
      setJournalEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter journal entries based on search term and active tab
  const filteredEntries = Array.isArray(journalEntries) 
    ? journalEntries.filter((entry) => {
        // Ensure entry and its properties exist before filtering
        if (!entry || !entry.memo || !entry._id) return false;
        
        const matchesSearch = 
          entry.memo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry._id.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === "all") return matchesSearch;
        return matchesSearch;
      })
    : [];

  // Format date for display based on calendar type
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDate(new Date(dateString), isNepaliCalendar);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Day Book</h1>
        <Button onClick={() => router.push("/dashboard/accounting/journal-entries/new")}>New Entry</Button>
      </div>

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Entries</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading journal entries...</p>
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
                    {filteredEntries.map((entry) => (
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
                            onClick={() => router.push(`/dashboard/accounting/journal-entries/${entry._id}`)}
                          >
                            View
                          </Button>
                        </CustomTableCell>
                      </CustomTableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 