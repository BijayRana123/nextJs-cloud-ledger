'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils';
import CustomerSection from "@/app/components/sales/customer-section";
import ItemsSection from "@/app/components/sales/items-section";
import CalculationSection from "@/app/components/sales/calculation-section";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/app/components/sales/items-section";
import { Printer, FileEdit, Trash2, CheckCircle, Mail, MoreVertical, FileSpreadsheet, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import EmailModal from "@/app/components/email-modal";
import SalesVoucherExcelDownload from "@/components/sales/SalesVoucherExcelDownload";
import SalesVoucherPdfDownload from "@/components/sales/SalesVoucherPdfDownload";

export default function SalesOrderDetailPage() {
  const { id } = useParams(); // Get the sales order ID from the URL
  const router = useRouter();
  
  const [salesOrder, setSalesOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailOrder, setEmailOrder] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [generatePdfBase64, setGeneratePdfBase64] = useState(null);

  useEffect(() => {
    fetchSalesOrder();
  }, [id]);

  const fetchSalesOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      
      // Make the API call with the authentication token
      const response = await fetch(`/api/organization/sales-vouchers/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sales order: ${response.status}`);
      }

      const data = await response.json();
      console.log("Sales Order Data:", data.salesOrder);
      setSalesOrder(data.salesOrder);
    } catch (err) {
      console.error("Error fetching sales order:", err);
      setError("An error occurred while fetching the sales order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Log salesOrder state after it's updated
  useEffect(() => {
    console.log("Sales Order state updated:", salesOrder);
  }, [salesOrder]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sales order?")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      
      // Make the API call with the authentication token
      const response = await fetch(`/api/organization/sales-vouchers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to sales vouchers page after successful deletion
        router.push('/dashboard/sales/sales-vouchers');
      } else {
        setDeleteError(result.message || "Failed to delete sales order");
      }
    } catch (err) {
      console.error("Error deleting sales order:", err);
      setDeleteError("An error occurred while deleting the sales order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    // Open the print view in a new tab/window
    if (salesOrder) {
      window.open(`/dashboard/sales/sales-vouchers/${salesOrder._id}/print`, '_blank');
    }
  };

  const handleEmailClick = async () => {
    if (salesOrder) {
      setEmailOrder(salesOrder);
      setIsEmailModalOpen(true);
      // Generate PDF preview for the modal
      if (generatePdfBase64) {
        const pdfUrl = await generatePdfBase64(salesOrder);
        setPdfPreviewUrl(pdfUrl);
      }
    }
  };

  // Function to dynamically import PDF generation for email modal
  useEffect(() => {
    import('./print/generatePdfBase64')
      .then(module => setGeneratePdfBase64(() => module.generatePdfBase64)) // Use functional update
      .catch(error => console.error('Failed to load PDF generation module:', error));
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading sales order...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!salesOrder) {
    return <div className="p-4 text-red-600">Sales order not found</div>;
  }

  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting sales order: {deleteError}</div>;
  }

  // Extract data from the salesOrder object
  const {
    customer,
    salesOrderNumber,
    date,
    dueDate,
    referenceNo,
    billNumber,
    customerInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isExport,
    items: salesItems
  } = salesOrder;

  // Format the items array for display
  const items = salesItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'No Code',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    tax: item.tax || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  // Get customer name
  const customerName = typeof customer === 'object' ? customer.name : customer;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/sales/sales-vouchers')}>
            Back to Sales Vouchers
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/sales/add-sales-voucher')}>
            + Add New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/add-sales-voucher?id=${id}`)}>
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
                  <Mail className="mr-2 h-4 w-4" /> Email
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={handleEmailClick}>
                    Email Sales Order
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <SalesVoucherExcelDownload salesOrder={salesOrder}>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </DropdownMenuItem>
                  </SalesVoucherExcelDownload>
                  <SalesVoucherPdfDownload salesOrder={salesOrder}>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                  </SalesVoucherPdfDownload>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sales Voucher Information</CardTitle>
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
                  <span className="text-gray-500">Due Date:</span>
                  <div>{dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sales Voucher No:</span>
                  <div>{salesOrder.salesVoucherNumber ? salesOrder.salesVoucherNumber : <span className="text-gray-400">Not generated yet</span>}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <div>{customerName || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address:</span>
                  <div>{customer?.address || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PAN:</span>
                  <div>{customer?.pan || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <div>{customer?.phoneNumber || 'N/A'}</div>
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
                  <div>{currency || 'NPR'} {salesOrder.totalAmount?.toFixed(2) || '0.00'}</div>
                </div>
                {isExport && currency !== 'NPR' && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Equivalent in NPR:</span>
                    <div>NPR {((salesOrder.totalAmount || 0) * (exchangeRateToNPR || 1)).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {salesOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{salesOrder.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && emailOrder && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          salesOrder={emailOrder}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`SalesVoucher-${emailOrder?.referenceNo || emailOrder?._id}.pdf`}
        />
      )}
    </div>
  );
}