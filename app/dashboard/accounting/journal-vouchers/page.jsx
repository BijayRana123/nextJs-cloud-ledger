"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JournalVouchersPage() {
  const router = useRouter();
  const [journalVouchers, setJournalVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    perPage: 10,
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchJournalVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.perPage,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
        ...(searchTerm && { searchTerm }),
      });
      const response = await fetch(
        `/api/accounting/journal-vouchers?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch journal vouchers");
      }

      const data = await response.json();
      setJournalVouchers(data.journalVouchers);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching journal vouchers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalVouchers();
  }, [pagination.currentPage, pagination.perPage, startDate, endDate, searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page on search
    fetchJournalVouchers(); // Re-fetch with new search term
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    // useEffect will re-fetch when these states change
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading journal vouchers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 text-red-500">
        <p>Error: {error}</p>
        <Button onClick={fetchJournalVouchers} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Journal Vouchers</h1>
        <Button onClick={() => router.push("/dashboard/accounting/journal-entries/new")}>
          Create New Journal Voucher
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search Memo</label>
              <Input
                id="searchTerm"
                placeholder="Search by memo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <div className="flex items-center gap-2">
                <ConditionalDatePicker
                  id="startDate"
                  name="startDate"
                  value={startDate ? startDate.toISOString().split('T')[0] : ""}
                  onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full"
                />
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <div className="flex items-center gap-2">
                <ConditionalDatePicker
                  id="endDate"
                  name="endDate"
                  value={endDate ? endDate.toISOString().split('T')[0] : ""}
                  onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full"
                />
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="col-span-1 md:col-span-3 flex justify-end gap-2">
              <Button onClick={handleSearch}>Apply Filters</Button>
              <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Journal Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          {journalVouchers.length === 0 ? (
            <p className="text-center text-gray-500">No journal vouchers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead className="text-right">Debits</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalVouchers.map((voucher) => {
                    const totalDebits = voucher.transactions
                      .filter((t) => t.debit)
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2);
                    const totalCredits = voucher.transactions
                      .filter((t) => t.credit)
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2);
                    return (
                      <TableRow key={voucher._id}>
                        <TableCell>{voucher.voucherNumber}</TableCell>
                        <TableCell>
                          {voucher.datetime && isValid(new Date(voucher.datetime))
                            ? format(new Date(voucher.datetime), "PPP")
                            : "N/A"}
                        </TableCell>
                        <TableCell>{voucher.memo}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${totalDebits}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          ${totalCredits}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/accounting/day-books/${voucher.voucherNumber}`
                              )
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <p>Total Vouchers: {pagination.totalCount}</p>
            <div className="flex space-x-2">
              <Button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 