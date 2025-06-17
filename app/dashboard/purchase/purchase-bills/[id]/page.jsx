"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils';
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable";
import { Printer, FileEdit, Trash2, CheckCircle } from "lucide-react";

export default function PurchaseBillDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [bill, setBill] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approveError, setApproveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch purchase bill: ${response.status}`);
      }
      const data = await response.json();
      setBill(data.purchaseOrder);
    } catch (err) {
      setError("An error occurred while fetching the purchase bill.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setApproveError(null);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-orders/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        fetchBill();
      } else {
        let errorMessage = result.message || "Failed to approve purchase bill";
        if (result.error) {
          errorMessage += `: ${result.error}`;
        }
        setApproveError(`Failed to approve purchase bill: ${response.status} - ${errorMessage}`);
      }
    } catch (err) {
      setApproveError(`An error occurred while approving the purchase bill: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this purchase bill?")) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        router.push('/dashboard/purchase/purchase-bills');
      } else {
        setDeleteError(result.message || "Failed to delete purchase bill");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the purchase bill.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    router.push(`/dashboard/purchase/purchase-bills/${id}/print`);
  };

  if (isLoading) {
    return <div className="p-4">Loading purchase bill...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }
  if (!bill) {
    return <div className="p-4 text-red-600">Purchase bill not found</div>;
  }
  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting purchase bill: {deleteError}</div>;
  }
  if (approveError) {
    return <div className="p-4 text-red-600">Error approving purchase bill: {approveError}</div>;
  }

  const {
    supplier,
    purchaseOrderNumber,
    date,
    dueDate,
    referenceNo,
    supplierInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isExport,
    items: billItems,
    totalAmount,
    notes
  } = bill;

  const items = billItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'No Code',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    tax: item.tax || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  const supplierName = typeof supplier === 'object' ? supplier.name : supplier;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold">Purchase Bill Details</h1>
      <div className="flex space-x-2 mb-4">
        {!isLoading && bill && (
          <>
            {bill.status === 'DRAFT' && (
              <>
                <Button variant="outline" onClick={() => router.push(`/dashboard/purchase/add-purchase-bill?id=${id}`)}>Edit</Button>
                <Button onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? 'Approving...' : 'Approve'}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                  <Trash2 className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handlePrint}>
              Print
              <Printer className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Purchase Bill Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number:</span>
                  <div>{purchaseOrderNumber || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <div>{dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Voucher No:</span>
                  <div>{referenceNo || 'N/A'}</div>
                </div>
                {bill.supplierBillNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier Bill No:</span>
                    <div>{bill.supplierBillNo}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Supplier Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <div>{supplierName || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address:</span>
                  <div>{supplier?.address || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PAN:</span>
                  <div>{supplier?.pan || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <div>{supplier?.phoneNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
          {isExport && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Export Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency:</span>
                  <div>{currency || 'NPR'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Exchange Rate to NPR:</span>
                  <div>{exchangeRateToNPR || '1'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomTable>
            <CustomTableHeader>
              <CustomTableRow>
                <CustomTableHead>Product</CustomTableHead>
                <CustomTableHead>Quantity</CustomTableHead>
                <CustomTableHead>Rate</CustomTableHead>
                <CustomTableHead>Discount</CustomTableHead>
                <CustomTableHead>Amount</CustomTableHead>
              </CustomTableRow>
            </CustomTableHeader>
            <CustomTableBody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <CustomTableRow key={index}>
                    <CustomTableCell>{item.productName}</CustomTableCell>
                    <CustomTableCell>{item.qty}</CustomTableCell>
                    <CustomTableCell>{item.rate.toFixed(2)}</CustomTableCell>
                    <CustomTableCell>{item.discount.toFixed(2)}</CustomTableCell>
                    <CustomTableCell>{item.amount.toFixed(2)}</CustomTableCell>
                  </CustomTableRow>
                ))
              ) : (
                <CustomTableRow>
                  <CustomTableCell colSpan="5" className="text-center py-4">
                    No items found
                  </CustomTableCell>
                </CustomTableRow>
              )}
            </CustomTableBody>
          </CustomTable>
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <div>{currency || 'NPR'} {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Discount:</span>
                  <div>{currency || 'NPR'} {items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Tax:</span>
                  <div>{currency || 'NPR'} {items.reduce((sum, item) => sum + item.tax, 0).toFixed(2)}</div>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <div>{currency || 'NPR'} {totalAmount?.toFixed(2) || '0.00'}</div>
                </div>
                {isExport && currency !== 'NPR' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Equivalent in NPR:</span>
                    <div>NPR {((totalAmount || 0) * (exchangeRateToNPR || 1)).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 