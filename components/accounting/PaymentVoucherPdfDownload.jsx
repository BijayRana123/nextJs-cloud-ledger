import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PaymentVoucherPdfDownload({ paymentVoucher, children }) {
  const generatePdf = (voucher) => {
    if (!voucher) return;

    const doc = new jsPDF();

    // Extract supplier info
    const supplier = voucher.supplier || {};
    const supplierName = supplier.name || voucher.supplierName || 'N/A';
    const supplierEmail = supplier.email || 'N/A';
    const supplierPhone = supplier.phoneNumber || supplier.phone || 'N/A';

    // Header
    doc.setFontSize(18);
    doc.text('Payment Voucher', 14, 22);

    // Supplier Info
    doc.setFontSize(12);
    doc.text('Supplier Information', 14, 32);
    doc.text(`Name: ${supplierName}`, 14, 39);
    doc.text(`Email: ${supplierEmail}`, 14, 46);
    doc.text(`Phone: ${supplierPhone}`, 14, 53);

    // Voucher Info
    doc.text(`Voucher No: ${voucher.paymentVoucherNumber || 'N/A'}`, 150, 32);
    doc.text(`Date: ${voucher.date ? new Date(voucher.date).toLocaleDateString() : 'N/A'}`, 150, 39);
    doc.text(`Payment Method: ${voucher.paymentMethod || 'N/A'}`, 150, 46);

    // Amount
    doc.setFontSize(14);
    doc.text('Amount:', 14, 70);
    doc.text(`${voucher.amount?.toFixed(2) || '0.00'}`, 50, 70);

    // Notes
    if (voucher.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Notes:', 14, 80);
      doc.text(voucher.notes, 14, 87, { maxWidth: 180 });
    }

    doc.save(`PaymentVoucher-${voucher.paymentVoucherNumber || voucher._id}.pdf`);
  };

  const handleDownload = () => {
    if (paymentVoucher) {
      generatePdf(paymentVoucher);
    }
  };

  if (React.Children.count(children) !== 1) {
      console.error("PaymentVoucherPdfDownload expects exactly one child element.");
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
