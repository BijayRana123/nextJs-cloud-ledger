import React from 'react';
import * as XLSX from 'xlsx';

export default function PaymentVoucherExcelDownload({ paymentVoucher, children }) {
  const handleDownload = () => {
    if (!paymentVoucher) return;

    const ws = XLSX.utils.json_to_sheet([
      {
        'Payment Voucher No': paymentVoucher.paymentVoucherNumber,
        'Supplier': paymentVoucher.supplier?.name || paymentVoucher.supplierName || 'N/A',
        'Date': paymentVoucher.date ? new Date(paymentVoucher.date).toLocaleDateString() : 'N/A',
        'Payment Method': paymentVoucher.paymentMethod || 'N/A',
        'Amount': paymentVoucher.amount?.toFixed(2) || '0.00',
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PaymentVoucher');
    XLSX.writeFile(wb, `PaymentVoucher-${paymentVoucher.paymentVoucherNumber || paymentVoucher._id}.xlsx`);
  };

  if (React.Children.count(children) !== 1) {
      console.error("PaymentVoucherExcelDownload expects exactly one child element.");
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