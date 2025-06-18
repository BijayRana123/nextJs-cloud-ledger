"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Printer, Trash2 } from "lucide-react";

export default function JournalEntryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchEntry = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/journal-entries/${id}`);
        const result = await response.json();
        if (response.ok && result.journalEntry) {
          setJournalEntry(result.journalEntry);
        } else {
          setError(result.error || 'Failed to fetch journal entry');
        }
      } catch (err) {
        setError('An error occurred while fetching journal entry.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/accounting/journal-entries/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/dashboard/accounting/journal-entries');
      } else {
        const result = await response.json();
        setDeleteError(result.error || "Failed to delete journal entry");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the journal entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading journal entry...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!journalEntry) return <div className="p-4 text-red-600">Journal entry not found</div>;

  // Helper to get account name without prefix
  const getAccountName = (fullPath) => fullPath?.split(':').pop() || fullPath || 'N/A';

  const date = journalEntry.datetime ? new Date(journalEntry.datetime).toLocaleDateString() : 'N/A';

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Journal Entry Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/accounting/journal-entries')}>
            Back to Journal Entries
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/journal-entries/new')}>
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/journal-entries/${id}/print`)}>
            <Printer className="h-5 w-5 mr-2" /> Print
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      {deleteError && <div className="text-red-600 mb-4">{deleteError}</div>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Journal Entry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{date}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Voucher No:</span>
                  <div>{journalEntry.voucherNumber || journalEntry._id}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Memo:</span>
                  <div>{journalEntry.memo || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border px-2 py-1">Account</th>
                <th className="border px-2 py-1">Debit</th>
                <th className="border px-2 py-1">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journalEntry.transactions && journalEntry.transactions.length > 0 ? (
                journalEntry.transactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{getAccountName(txn.account || txn.account_path?.join(':'))}</td>
                    <td className="border px-2 py-1 text-green-600 font-semibold">{txn.debit ? `$${txn.amount.toFixed(2)}` : '-'}</td>
                    <td className="border px-2 py-1 text-red-600 font-semibold">{txn.credit ? `$${txn.amount.toFixed(2)}` : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 