"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/utils/auth-helpers";
import { Printer, Trash2, Plus } from "lucide-react";

export default function ReceiptVoucherDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVoucher();
    }
  }, [id]);

  const fetchVoucher = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/receipt-vouchers/${id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch receipt voucher");
      }
      setVoucher(data.receiptVoucher);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this receipt voucher?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/organization/receipt-vouchers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete receipt voucher");
      }
      toast.success("Receipt voucher deleted successfully.");
      router.push('/dashboard/accounting/transactions/receive-payment');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!voucher) return <div className="p-4">Receipt voucher not found.</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receipt Voucher Details</h1>
        <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/accounting/transactions/receive-payment')}>
                Back
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/transactions/receive-payment/new')}>
                <Plus className="h-5 w-5 mr-2" /> Add New
            </Button>
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-5 w-5 mr-2" /> Print
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
            </Button>
        </div>
      </div>
      
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
                  <div>{new Date(voucher.date).toLocaleDateString()}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Receipt Voucher No:</span>
                  <div>{voucher.receiptVoucherNumber}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <div>{voucher.customer?.name || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <div>${voucher.amount.toFixed(2)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <div>{voucher.paymentMethod}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Memo:</span>
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
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Account</th>
                <th className="border px-4 py-2 text-right">Amount</th>
                <th className="border px-4 py-2 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {voucher.transactions?.map((t, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{t.account?.split(':').pop() || 'N/A'}</td>
                  <td className="border px-4 py-2 text-right">{t.amount?.toFixed(2)}</td>
                  <td className="border px-4 py-2">{t.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 