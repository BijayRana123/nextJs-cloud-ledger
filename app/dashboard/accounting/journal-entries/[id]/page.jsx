"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function JournalEntryPage({ params }) {
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const id = use(params).id;

  useEffect(() => {
    fetchJournalEntry();
  }, [id]);

  const fetchJournalEntry = async () => {
    try {
      // Get current organization from localStorage or context
      const currentOrganization = JSON.parse(localStorage.getItem('currentOrganization') || '{}');
      
      const response = await fetch(`/api/accounting/journal-vouchers/${id}`, {
        headers: {
          'x-organization-id': currentOrganization._id || '',
        },
      });
      const data = await response.json();

      // Handle redirect to correct ID
      if (data.redirect && data.correctId) {
        router.replace(`/dashboard/accounting/journal-entries/${data.correctId}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journal entry');
      }

      setJournalEntry(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journal voucher?")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Get current organization from localStorage or context
      const currentOrganization = JSON.parse(localStorage.getItem('currentOrganization') || '{}');
      
      const response = await fetch(`/api/accounting/journal-vouchers/${id}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': currentOrganization._id || '',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete journal voucher');
      }

      toast.success("Journal voucher deleted successfully");
      router.push('/dashboard/accounting/journal-entries');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-red-500">{error}</div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  if (!journalEntry) {
    return (
      <div className="container mx-auto py-6">
        <div>Journal entry not found</div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  // Helper to get voucher number
  const getVoucherNumber = (entry) => entry.voucherNumber || entry.referenceNo || entry._id;
  // Helper to get date
  const getDate = (entry) => entry.datetime || entry.date;
  // Helper to get account name (remove prefix)
  const getAccountName = (txn) => {
    const raw = txn.account || txn.accounts || (txn.account_path && txn.account_path.join(':')) || '-';
    if (typeof raw === 'string' && raw.includes(':')) {
      return raw.split(':').pop();
    }
    if (Array.isArray(raw)) {
      return raw[raw.length - 1] || '-';
    }
    return raw;
  };
  // Helper to get type
  const getType = (txn) => txn.type ? (txn.type.charAt(0).toUpperCase() + txn.type.slice(1)) : (txn.debit ? 'Debit' : 'Credit');
  // Helper to get amount
  const getAmount = (txn) => typeof txn.amount === 'number' ? txn.amount : Number(txn.amount) || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d) ? 'N/A' : d.toLocaleString();
  };

  const calculateTotal = (type) => {
    return journalEntry.transactions
      .filter((t) => (t.type ? t.type === type : (type === 'debit' ? t.debit : t.credit)))
      .reduce((sum, t) => sum + getAmount(t), 0)
      .toFixed(2);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Journal Voucher Details</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/accounting/journal-entries')}
          >
            Back to Journal Vouchers
          </Button>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => router.push('/dashboard/accounting/journal-entries/new')}
          >
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button 
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="h-5 w-5 mr-2" /> Print
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal Voucher #{getVoucherNumber(journalEntry)}</CardTitle>
            <CardDescription>
              Created on {formatDate(getDate(journalEntry))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold">Memo</h3>
                <p className="text-gray-600">{journalEntry.memo}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Transactions</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntry.transactions.map((txn, idx) => (
                        <TableRow key={txn._id || idx}>
                          <TableCell className="font-medium">{getAccountName(txn)}</TableCell>
                          <TableCell>{getType(txn)}</TableCell>
                          <TableCell className="text-right">
                            ${getAmount(txn).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-4 mt-4 text-lg font-semibold">
                  <span>Total Debits: ${calculateTotal('debit')}</span>
                  <span>Total Credits: ${calculateTotal('credit')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print-specific styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .container, .container * {
              visibility: visible;
            }
            .container {
              position: absolute;
              left: 0;
              top: 0;
            }
            button {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
} 