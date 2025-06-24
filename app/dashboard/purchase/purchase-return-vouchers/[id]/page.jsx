"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import { getCookieValue } from '@/utils/getCookieValue';
import SupplierSection from "@/app/components/purchase/supplier-section";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable";
import { Printer, FileEdit, Trash2, CheckCircle, MoreVertical, Mail, FileSpreadsheet, FileText } from "lucide-react";
import PurchaseReturnExcelDownload from "@/components/purchase/PurchaseReturnExcelDownload";
import PurchaseReturnPdfDownload from "@/components/purchase/PurchaseReturnPdfDownload";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import EmailModal from "@/app/components/email-modal";

export default function PurchaseReturnVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [purchaseReturn, setPurchaseReturn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approveError, setApproveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailVoucher, setEmailVoucher] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");

  useEffect(() => {
    fetchPurchaseReturn();
  }, [id]);

  const fetchPurchaseReturn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authToken = getCookieValue('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      console.log('authToken:', authToken); // Debug: check if token is present
      const response = await fetch(`/api/organization/purchase-return-vouchers/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch purchase return voucher: ${response.status}`);
      }
      const data = await response.json();
      setPurchaseReturn(data.purchaseReturn);
    } catch (err) {
      setError("An error occurred while fetching the purchase return voucher.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this purchase return voucher?")) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const authToken = getCookieValue('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-return-vouchers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        router.push('/dashboard/purchase/purchase-return-vouchers');
      } else {
        setDeleteError(result.message || "Failed to delete purchase return voucher");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the purchase return voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    router.push(`/dashboard/purchase/purchase-return-vouchers/${id}/print`);
  };

  const handleEmailClick = async () => {
    if (purchaseReturn) {
      setEmailVoucher(purchaseReturn);
      setIsEmailModalOpen(true);
      // Optionally, generate PDF preview if you have a function for it
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading purchase return voucher...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }
  if (!purchaseReturn) {
    return <div className="p-4 text-red-600">Purchase return voucher not found</div>;
  }
  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting purchase return voucher: {deleteError}</div>;
  }
  if (approveError) {
    return <div className="p-4 text-red-600">Error approving purchase return voucher: {approveError}</div>;
  }

  // Extract data from the purchaseReturn object
  const {
    supplier,
    returnNumber,
    date,
    referenceNo,
    supplierInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isExport,
    items: returnItems,
    totalAmount,
    status,
    notes
  } = purchaseReturn;

  // Format the items array for display
  const items = returnItems?.map(item => ({
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Return Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/purchase/purchase-return-vouchers')}>Back to Purchase Return Vouchers</Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/purchase/add-purchase-return')}>+ Add New</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/purchase/add-purchase-return?id=${id}`)}>
                <FileEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <PurchaseReturnExcelDownload purchaseReturn={purchaseReturn}>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </DropdownMenuItem>
                  </PurchaseReturnExcelDownload>
                  <PurchaseReturnPdfDownload purchaseReturn={purchaseReturn}>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                  </PurchaseReturnPdfDownload>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={handleEmailClick}>
                    Email Purchase Return Voucher
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Purchase Return Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Return Bill No:</span>
                  <div>{purchaseReturn.billNumber || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Return Voucher No:</span>
                  <div>{referenceNo ? referenceNo.replace(/^PR-/, 'PRV-') : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
                </div>
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

      {isEmailModalOpen && emailVoucher && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          purchaseReturn={emailVoucher}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`PurchaseReturnVoucher-${emailVoucher?.referenceNo || emailVoucher?._id}.pdf`}
        />
      )}
    </div>
  );
} 