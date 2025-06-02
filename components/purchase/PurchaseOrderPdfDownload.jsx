import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PurchaseOrderPdfDownload({ purchaseOrder, children }) {
  const generatePdf = (order) => {
    if (!order) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Purchase Order', 14, 22);

    // Supplier Info
    doc.setFontSize(12);
    doc.text('Supplier Information', 14, 32);
    doc.text(`Name: ${order.supplier?.name || 'N/A'}`, 14, 39);
    doc.text(`Address: ${order.supplier?.address || 'N/A'}`, 14, 46);
    doc.text(`PAN: ${order.supplier?.pan || 'N/A'}`, 14, 53);
    doc.text(`Phone: ${order.supplier?.phoneNumber || 'N/A'}`, 14, 60);

    // Order Info
    doc.text(`Order No: ${order.purchaseOrderNumber || 'N/A'}`, 150, 32);
    doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}`, 150, 39);
    doc.text(`Due Date: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}`, 150, 46);
    doc.text(`Reference No: ${order.referenceNo || 'N/A'}`, 150, 53);
    doc.text(`Supplier Bill No: ${order.supplierBillNo || 'N/A'}`, 150, 60);

    // Items Table
    const items = order.items?.map(item => [
      item.item?.name || 'Unknown Product',
      item.quantity || 0,
      (item.price || 0).toFixed(2),
      ((item.quantity || 0) * (item.price || 0)).toFixed(2)
    ]) || [];

    autoTable(doc, {
      startY: 70,
      head: [['Product', 'Quantity', 'Rate', 'Amount']],
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
      }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Grand Total:', 150, finalY);
    doc.text(`${order.currency || 'NPR'} ${order.totalAmount?.toFixed(2) || '0.00'}`, 200, finalY, { align: 'right' });

    // Notes
    if (order.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Notes:', 14, finalY + 10);
      doc.text(order.notes, 14, finalY + 17, { maxWidth: 180 });
    }

    doc.save(`PurchaseVoucher-${order.referenceNo || order._id}.pdf`);
  };

  const handleDownload = () => {
    if (purchaseOrder) {
      generatePdf(purchaseOrder);
    }
  };

  if (React.Children.count(children) !== 1) {
      console.error("PurchaseOrderPdfDownload expects exactly one child element.");
      return null;
  }

  const child = React.Children.only(children);

  return React.cloneElement(child, {
      onClick: (e) => {
          e.stopPropagation();
          handleDownload();
      },
  });
} 