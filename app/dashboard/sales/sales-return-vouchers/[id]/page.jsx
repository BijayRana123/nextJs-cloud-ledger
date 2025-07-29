"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils';
import CustomerSection from "@/components/sales/customer-section";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable";
import { Printer, FileEdit, Trash2, CheckCircle, MoreVertical, FileSpreadsheet, FileText, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Rocket } from "lucide-react";
import EmailModal from "@/components/email-modal";
import SalesReturnVoucherPdfDownload from "@/components/sales/SalesReturnVoucherPdfDownload";
import SalesReturnVoucherExcelDownload from "@/components/sales/SalesReturnVoucherExcelDownload";

export default function SalesReturnVoucherDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [salesReturnVoucher, setSalesReturnVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetchSalesReturnVoucher();
  }, [id]);

  const fetchSalesReturnVoucher = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/sales-return-vouchers/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch sales return voucher: ${response.status}`);
      }
      const data = await response.json();
      console.log("Sales Return Voucher Data:", data.salesReturnVoucher);
      setSalesReturnVoucher(data.salesReturnVoucher);
    } catch (err) {
      console.error("Error fetching sales return voucher:", err);
      setError("An error occurred while fetching the sales return voucher.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Sales Return Voucher state updated:", salesReturnVoucher);
  }, [salesReturnVoucher]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sales return voucher?")) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/sales-return-vouchers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        router.push('/dashboard/sales/sales-return-vouchers');
      } else {
        setDeleteError(result.message || "Failed to delete sales return voucher");
      }
    } catch (err) {
      console.error("Error deleting sales return voucher:", err);
      setDeleteError("An error occurred while deleting the sales return voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    if (salesReturnVoucher) {
      window.open(`/dashboard/sales/sales-return-vouchers/${salesReturnVoucher._id}/print`, '_blank');
    }
  };

  const handleEmail = async () => {
    try {
      // Create a temporary instance of the PDF for email
      if (!salesReturnVoucher) return;
      
      // Create a new jsPDF instance
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Sales Return Voucher', 14, 22);
      
      // Customer Info
      doc.setFontSize(12);
      doc.text('Customer Information', 14, 32);
      doc.text(`Name: ${salesReturnVoucher.customer?.name || 'N/A'}`, 14, 39);
      doc.text(`Address: ${salesReturnVoucher.customer?.address || 'N/A'}`, 14, 46);
      doc.text(`PAN: ${salesReturnVoucher.customer?.pan || 'N/A'}`, 14, 53);
      doc.text(`Phone: ${salesReturnVoucher.customer?.phoneNumber || 'N/A'}`, 14, 60);
      
      // Order Info
      doc.text(`Return Voucher No: ${salesReturnVoucher.salesReturnNumber || salesReturnVoucher.referenceNo || 'N/A'}`, 150, 32, { align: 'right' });
      doc.text(`Date: ${salesReturnVoucher.date ? new Date(salesReturnVoucher.date).toLocaleDateString() : 'N/A'}`, 150, 39, { align: 'right' });
      doc.text(`Due Date: ${salesReturnVoucher.dueDate ? new Date(salesReturnVoucher.dueDate).toLocaleDateString() : 'N/A'}`, 150, 46, { align: 'right' });
      if (salesReturnVoucher.billNumber) {
        doc.text(`Bill Number: ${salesReturnVoucher.billNumber}`, 150, 53, { align: 'right' });
      }
      if (salesReturnVoucher.customerInvoiceReferenceNo) {
        doc.text(`Customer Invoice Ref: ${salesReturnVoucher.customerInvoiceReferenceNo}`, 150, 60, { align: 'right' });
      }
      
      // Items Table
      const items = salesReturnVoucher.items?.map(item => [
        item.item?.name || 'Unknown Product',
        item.quantity || 0,
        (item.price || 0).toFixed(2),
        (item.discount || 0).toFixed(2),
        ((item.quantity || 0) * (item.price || 0)).toFixed(2)
      ]) || [];
      
      autoTable(doc, {
        startY: 70,
        head: [['Product', 'Quantity', 'Rate', 'Discount', 'Amount']],
        body: items,
        theme: 'striped',
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { cellPadding: 3, fontSize: 10, valign: 'middle', halign: 'center' },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
        }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Subtotal:', 150, finalY, { align: 'right' });
      doc.text(`${salesReturnVoucher.currency || 'NPR'} ${items.reduce((sum, item) => sum + parseFloat(item[4]), 0).toFixed(2)}`, 200, finalY, { align: 'right' });
      doc.text('Total Discount:', 150, finalY + 7, { align: 'right' });
      doc.text(`${salesReturnVoucher.currency || 'NPR'} ${items.reduce((sum, item) => sum + parseFloat(item[3]), 0).toFixed(2)}`, 200, finalY + 7, { align: 'right' });
      
      // Add tax if available
      const taxTotal = items.reduce((sum, item) => sum + (parseFloat(item[2]) || 0), 0);
      if (taxTotal > 0) {
        doc.text('Total Tax:', 150, finalY + 14, { align: 'right' });
        doc.text(`${salesReturnVoucher.currency || 'NPR'} ${taxTotal.toFixed(2)}`, 200, finalY + 14, { align: 'right' });
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Grand Total:', 150, finalY + 21, { align: 'right' });
      doc.text(`${salesReturnVoucher.currency || 'NPR'} ${salesReturnVoucher.totalAmount?.toFixed(2) || '0.00'}`, 200, finalY + 21, { align: 'right' });
      
      // Add NPR equivalent if export
      if (salesReturnVoucher.isExport && salesReturnVoucher.currency !== 'NPR') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Equivalent in NPR:', 150, finalY + 28, { align: 'right' });
        doc.text(`NPR ${((salesReturnVoucher.totalAmount || 0) * (salesReturnVoucher.exchangeRateToNPR || 1)).toFixed(2)}`, 200, finalY + 28, { align: 'right' });
      }
      
      // Notes
      if (salesReturnVoucher.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Notes:', 14, finalY + 35);
        doc.text(salesReturnVoucher.notes, 14, finalY + 42, { maxWidth: 180 });
      }
      
      // Convert the PDF to a data URL
      const pdfDataUrl = doc.output('datauristring');
      setPdfUrl(pdfDataUrl);
      setIsEmailModalOpen(true);
    } catch (error) {
      console.error("Error generating PDF for email:", error);
      alert("Failed to generate PDF for email");
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading sales return voucher...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  if (!salesReturnVoucher) {
    return <div className="p-4 text-red-600">Sales return voucher not found</div>;
  }
  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting sales return voucher: {deleteError}</div>;
  }

  // Extract data from the salesReturnVoucher object
  const {
    customer,
    referenceNo, // Use referenceNo as the voucher number
    date,
    dueDate,
    billNumber,
    customerInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isExport,
    items: salesReturnItems,
    totalAmount,
    notes
  } = salesReturnVoucher;

  // Format the items array for display
  const items = salesReturnItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'No Code',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    tax: item.tax || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  const customerName = typeof customer === 'object' ? customer.name : customer;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Return Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/sales/sales-return-vouchers')}>
            Back to Sales Return Vouchers
          </Button>
          <Link href="/dashboard/sales/add-sales-return" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
            <Rocket className="h-5 w-5 mr-2" />
            ADD NEW
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Options"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/sales/add-sales-return-voucher?id=${id}`)}>
                <FileEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmail}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <SalesReturnVoucherExcelDownload salesOrder={salesReturnVoucher}>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </DropdownMenuItem>
                  </SalesReturnVoucherExcelDownload>
                  <SalesReturnVoucherPdfDownload salesOrder={salesReturnVoucher}>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                  </SalesReturnVoucherPdfDownload>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sales Return Voucher Information</CardTitle>
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
                  <span className="text-gray-500">Sales Return Voucher No:</span>
                  <div>{referenceNo || 'N/A'}</div>
                </div>
                {billNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bill Number:</span>
                    <div>{billNumber}</div>
                  </div>
                )}
                {customerInvoiceReferenceNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer Invoice Ref No:</span>
                    <div>{customerInvoiceReferenceNo}</div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <div>{customerName || 'N/A'}</div>
                </div>
                {customer?.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address:</span>
                    <div>{customer.address}</div>
                  </div>
                )}
                {customer?.pan && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PAN:</span>
                    <div>{customer.pan}</div>
                  </div>
                )}
                {customer?.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <div>{customer.phoneNumber}</div>
                  </div>
                )}
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

      {/* Email Modal */}
      {isEmailModalOpen && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }}
          to={salesReturnVoucher?.customer?.email || ''}
          subject={`Sales Return Voucher - ${referenceNo || 'N/A'}`}
          body={`Dear ${salesReturnVoucher?.customer?.name || 'Customer'},\n\nPlease find attached the sales return voucher ${referenceNo || 'N/A'}.\n\nThank you for your business.\n\nRegards,\nYour Company`}
          pdfPreviewUrl={pdfUrl}
          pdfFileName={`SalesReturnVoucher-${referenceNo || id}.pdf`}
          orderId={id}
          type="sales-return-voucher"
          onEmailSent={() => alert('Email sent successfully!')}
        />
      )}
    </div>
  );
}