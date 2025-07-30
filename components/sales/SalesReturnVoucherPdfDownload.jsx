import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function SalesReturnVoucherPdfDownload({ salesOrder, children }) {
  const generatePdf = (order) => {
    if (!order) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Sales Return Voucher', 14, 22);

    // Customer Info
    doc.setFontSize(12);
    doc.text('Customer Information', 14, 32);
    doc.text(`Name: ${order.customer?.name || 'N/A'}`, 14, 39);
    doc.text(`Address: ${order.customer?.address || 'N/A'}`, 14, 46);
    doc.text(`PAN: ${order.customer?.pan || 'N/A'}`, 14, 53);
    doc.text(`Phone: ${order.customer?.phoneNumber || 'N/A'}`, 14, 60);

    // Order Info
    doc.text(`Return Voucher No: ${order.salesReturnNumber || order.referenceNo || 'N/A'}`, 150, 32, { align: 'right' });
    doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}`, 150, 39, { align: 'right' });
    doc.text(`Due Date: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}`, 150, 46, { align: 'right' });
    if (order.billNumber) {
      doc.text(`Bill Number: ${order.billNumber}`, 150, 53, { align: 'right' });
    }
    if (order.customerInvoiceReferenceNo) {
      doc.text(`Customer Invoice Ref: ${order.customerInvoiceReferenceNo}`, 150, 60, { align: 'right' });
    }

    // Items Table
    const items = order.items?.map(item => [
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
    doc.text(`${order.currency || 'NPR'} ${items.reduce((sum, item) => sum + parseFloat(item[4]), 0).toFixed(2)}`, 200, finalY, { align: 'right' });
    doc.text('Total Discount:', 150, finalY + 7, { align: 'right' });
    doc.text(`${order.currency || 'NPR'} ${items.reduce((sum, item) => sum + parseFloat(item[3]), 0).toFixed(2)}`, 200, finalY + 7, { align: 'right' });
    
    // Add tax if available
    const taxTotal = items.reduce((sum, item) => sum + (parseFloat(item[2]) || 0), 0);
    if (taxTotal > 0) {
      doc.text('Total Tax:', 150, finalY + 14, { align: 'right' });
      doc.text(`${order.currency || 'NPR'} ${taxTotal.toFixed(2)}`, 200, finalY + 14, { align: 'right' });
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 150, finalY + 21, { align: 'right' });
    doc.text(`${order.currency || 'NPR'} ${order.totalAmount?.toFixed(2) || '0.00'}`, 200, finalY + 21, { align: 'right' });

    // Add NPR equivalent if export
    if (order.isExport && order.currency !== 'NPR') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Equivalent in NPR:', 150, finalY + 28, { align: 'right' });
      doc.text(`NPR ${((order.totalAmount || 0) * (order.exchangeRateToNPR || 1)).toFixed(2)}`, 200, finalY + 28, { align: 'right' });
    }

    // Notes
    if (order.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Notes:', 14, finalY + 35);
      doc.text(order.notes, 14, finalY + 42, { maxWidth: 180 });
    }

    doc.save(`SalesReturnVoucher-${order.salesReturnNumber || order.referenceNo || order._id}.pdf`);
  };

  const handleDownload = () => {
    if (salesOrder) {
      generatePdf(salesOrder);
    }
  };

  // Render children (the menu item) and attach the onClick handler
  if (React.Children.count(children) !== 1) {
      console.error("SalesReturnVoucherPdfDownload expects exactly one child element.");
      return null; // Or handle error appropriately
  }

  const child = React.Children.only(children);

  return React.cloneElement(child, {
      onClick: (e) => {
          e.stopPropagation(); // Prevent closing the dropdown immediately
          handleDownload();
      },
      // Optionally pass other props if needed
  });
}
