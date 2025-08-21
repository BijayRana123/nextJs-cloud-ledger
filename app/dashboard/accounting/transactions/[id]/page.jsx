"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrganization } from '@/lib/context/OrganizationContext';
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function TransactionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id || !currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/transactions/${id}`, {
          headers: { 'x-organization-id': currentOrganization._id },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch transaction');
        setTransaction(data.transaction);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, currentOrganization]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? 'N/A' : date.toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(2) : '0.00';
  };

  const handleNavigateToSource = () => {
    if (!transaction?.meta) return;
    
    const meta = transaction.meta;
    if (meta.purchaseVoucherId) {
      router.push(`/dashboard/purchase/purchase-bills/${meta.purchaseVoucherId}`);
    } else if (meta.salesVoucherId) {
      router.push(`/dashboard/sales/sales-vouchers/${meta.salesVoucherId}`);
    } else if (meta.purchaseReturnId) {
      router.push(`/dashboard/purchase/purchase-return-vouchers/${meta.purchaseReturnId}`);
    } else if (meta.salesReturnId) {
      router.push(`/dashboard/sales/sales-return-vouchers/${meta.salesReturnId}`);
    } else if (meta.paymentVoucherId) {
      router.push(`/dashboard/accounting/vouchers/payment/${meta.paymentVoucherId}`);
    } else if (meta.receiptVoucherId) {
      router.push(`/dashboard/accounting/vouchers/receipt/${meta.receiptVoucherId}`);
    } else if (meta.expenseVoucherId) {
      router.push(`/dashboard/accounting/vouchers/expense/${meta.expenseVoucherId}`);
    } else if (meta.incomeVoucherId) {
      router.push(`/dashboard/accounting/vouchers/income/${meta.incomeVoucherId}`);
    } else if (transaction.journalId) {
      router.push(`/dashboard/accounting/journal-entries/${transaction.journalId}`);
    }
  };

  const getTransactionType = () => {
    if (!transaction?.meta) return 'General Transaction';
    
    const meta = transaction.meta;
    if (meta.purchaseVoucherId) return 'Purchase';
    if (meta.salesVoucherId) return 'Sales';
    if (meta.purchaseReturnId) return 'Purchase Return';
    if (meta.salesReturnId) return 'Sales Return';
    if (meta.paymentVoucherId) return 'Payment';
    if (meta.receiptVoucherId) return 'Receipt';
    if (meta.expenseVoucherId) return 'Expense';
    if (meta.incomeVoucherId) return 'Income';
    return 'Journal Entry';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading transaction details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Transaction not found</p>
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>
        {transaction.meta && Object.keys(transaction.meta).length > 0 && (
          <Button onClick={handleNavigateToSource}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Source Document
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction Information</span>
              <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {getTransactionType()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="text-sm font-mono">{transaction._id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p>{formatDate(transaction.datetime || transaction.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Reference</label>
                <p>{transaction.reference || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="font-semibold">${formatAmount(transaction.amount)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p>{transaction.memo || transaction.description || 'No description available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account</label>
                <p>{transaction.accounts || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction Type</label>
                <p className="capitalize">
                  {transaction.debit ? 'Debit' : transaction.credit ? 'Credit' : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {transaction.meta && Object.keys(transaction.meta).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(transaction.meta).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
