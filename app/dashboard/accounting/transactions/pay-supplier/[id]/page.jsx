"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { MoreVertical, FileEdit, Trash2, Printer, Plus } from "lucide-react";

export default function PaymentVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [paymentVoucher, setPaymentVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchPaymentVoucher();
  }, [id]);

  const fetchPaymentVoucher = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/payment-vouchers/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch payment voucher: ${response.status}`);
      }
      const data = await response.json();
      setPaymentVoucher(data.paymentVoucher);
    } catch (err) {
      setError("An error occurred while fetching the payment voucher.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payment voucher?")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/organization/payment-vouchers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/dashboard/accounting/transactions/pay-supplier');
      } else {
        const result = await response.json();
        setDeleteError(result.message || "Failed to delete payment voucher");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the payment voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading payment voucher...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!paymentVoucher) {
    return <div className="p-4 text-red-600">Payment voucher not found</div>;
  }

  const {
    paymentVoucherNumber,
    date,
    supplierName,
    amount,
    paymentMethod,
    notes,
    memo,
    transactions
  } = paymentVoucher;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/accounting/transactions/pay-supplier')}>
            Back to Payment Vouchers
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/transactions/pay-supplier/new')}>
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/pay-supplier/${id}/print`)}>
            <Printer className="h-5 w-5 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/accounting/transactions/pay-supplier/${id}/edit`)}>
            <FileEdit className="h-5 w-5 mr-2" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      {deleteError && <div className="text-red-600 mb-4">{deleteError}</div>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Voucher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Voucher No:</span>
                  <div>{paymentVoucherNumber || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <div>{supplierName || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <div>{amount?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <div>{paymentMethod || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Memo:</span>
                  <div>{memo || ''}</div>
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
              {transactions?.map((t, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{t.account ? t.account.split(':').pop() : 'N/A'}</td>
                  <td className="border px-2 py-1">{t.amount?.toFixed(2)}</td>
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