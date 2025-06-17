"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { MoreVertical, FileEdit, Trash2, Printer, Plus } from "lucide-react";

export default function ReceiptVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('N/A');

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  useEffect(() => {
    async function fetchCustomerName() {
      if (customerId) {
        try {
          const res = await fetch(`/api/organization/customers/${customerId}`);
          if (res.ok) {
            const data = await res.json();
            setCustomerName(data.customer?.name || 'N/A');
          }
        } catch {
          setCustomerName('N/A');
        }
      }
    }
    fetchCustomerName();
  }, [customerId]);

  const fetchVoucher = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/journal-entries?_id=${id}`);
      const result = await response.json();
      if (response.ok && result.journalEntries && result.journalEntries.length > 0) {
        setVoucher(result.journalEntries[0]);
        setTransactions(result.journalEntries[0].transactions || []);
        setCustomerId(result.journalEntries[0].transactions?.find(t => t.meta?.customerId)?.meta?.customerId);
      } else {
        setError('Receipt voucher not found');
      }
    } catch (err) {
      setError('An error occurred while fetching receipt voucher.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this receipt voucher?")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/accounting/journal-entries/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/dashboard/accounting/transactions/receive-payment');
      } else {
        const result = await response.json();
        setDeleteError(result.message || "Failed to delete receipt voucher");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the receipt voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading receipt voucher...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!voucher) {
    return <div className="p-4 text-red-600">Receipt voucher not found</div>;
  }

  // Extract customer name and payment method from meta fields (find first non-N/A value)
  const customerMetaName = (voucher.transactions?.map(t => t.meta?.customerName).find(name => name && name !== 'N/A')) || customerName || 'N/A';
  const paymentMethod = (voucher.transactions?.find(t => t.debit && t.meta?.paymentMethod)?.accounts?.split(':').pop()) || 'N/A';
  const receiptVoucherNumber = voucher.transactions?.find(t => t.meta?.receiptVoucherNumber)?.meta?.receiptVoucherNumber || voucher.voucherNumber || 'N/A';
  const amount = voucher.amount || voucher.transactions?.[0]?.amount || 'N/A';
  const date = voucher.datetime ? new Date(voucher.datetime).toLocaleDateString() : 'N/A';
  // Memo: replace any customerId with customer name
  let memo = voucher.memo || '';
  if (memo && customerName && memo.includes('Customer')) {
    memo = memo.replace(/Customer [0-9a-fA-F]{24}/, `Customer ${customerName}`);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receipt Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/accounting/transactions/receive-payment')}>
            Back to Receipt Vouchers
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/transactions/receive-payment/new')}>
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/receive-payment/${id}/print`)}>
            <Printer className="h-5 w-5 mr-2" /> Print
          </Button>
          {/* Uncomment and implement edit if needed */}
          {/* <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/receive-payment/${id}/edit`)}>
            <FileEdit className="h-5 w-5 mr-2" /> Edit
          </Button> */}
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      {deleteError && <div className="text-red-600 mb-4">{deleteError}</div>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Receipt Voucher Information</CardTitle>
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
                  <span className="text-gray-500">Receipt Voucher No:</span>
                  <div>{receiptVoucherNumber}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <div>{customerMetaName}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <div>{amount}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <div>{paymentMethod}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Memo:</span>
                  <div>{memo}</div>
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
                  <td className="border px-2 py-1">{t.accounts ? t.accounts.split(':').pop() : 'N/A'}</td>
                  <td className="border px-2 py-1">{t.amount}</td>
                  <td className="border px-2 py-1">{t.debit ? 'Debit' : t.credit ? 'Credit' : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 