"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { MoreVertical, FileEdit, Trash2, Printer, Plus } from "lucide-react";

export default function ContraVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchVoucher = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/vouchers/contra`);
        const result = await response.json();
        if (response.ok && result.contraVouchers) {
          const found = result.contraVouchers.find(v => v._id === id);
          if (found) {
            setVoucher(found);
          } else {
            setError('Contra voucher not found');
          }
        } else {
          setError(result.message || 'Failed to fetch contra voucher');
        }
      } catch (err) {
        setError('An error occurred while fetching contra voucher.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contra voucher?")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/accounting/vouchers/contra/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/dashboard/accounting/transactions/contra-voucher');
      } else {
        const result = await response.json();
        setDeleteError(result.message || "Failed to delete contra voucher");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the contra voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading contra voucher...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!voucher) return <div className="p-4 text-red-600">Contra voucher not found</div>;

  // Helper to get account name without prefix
  const getAccountName = (fullPath) => fullPath?.split(':').pop() || fullPath || 'N/A';

  // Build a transactions array for table (for consistency)
  const transactions = [
    { account: voucher.fromAccount, amount: voucher.amount, type: 'Credit' },
    { account: voucher.toAccount, amount: voucher.amount, type: 'Debit' },
  ];

  const date = voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A';

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contra Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/accounting/transactions/contra-voucher')}>
            Back to Contra Vouchers
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/transactions/contra-voucher/new')}>
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}/print`)}>
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
          <CardTitle>Contra Voucher Information</CardTitle>
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
                  <span className="text-gray-500">Contra Voucher No:</span>
                  <div>{voucher.referenceNo}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">From Account:</span>
                  <div>{getAccountName(voucher.fromAccount)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To Account:</span>
                  <div>{getAccountName(voucher.toAccount)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <div>{voucher.amount}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes:</span>
                  <div>{voucher.notes || ''}</div>
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
                <th className="border px-2 py-1">Amount</th>
                <th className="border px-2 py-1">Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{getAccountName(t.account)}</td>
                  <td className="border px-2 py-1">{t.amount}</td>
                  <td className="border px-2 py-1">{t.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 