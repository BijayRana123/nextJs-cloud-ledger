import React from 'react';
import * as XLSX from 'xlsx';

export default function PurchaseReturnExcelDownload({ purchaseReturn, children }) {
  const handleDownload = () => {
    if (!purchaseReturn) return;

    const ws = XLSX.utils.json_to_sheet([
      {
        'Purchase Return Voucher Reference No': purchaseReturn.referenceNo,
        'Supplier': purchaseReturn.supplier?.name || 'N/A',
        'Date': purchaseReturn.date ? new Date(purchaseReturn.date).toLocaleDateString() : 'N/A',
        'Bill No': purchaseReturn.billNumber || 'N/A',
        'Amount': purchaseReturn.totalAmount?.toFixed(2) || '0.00',
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PurchaseReturnVoucher');
    XLSX.writeFile(wb, `PurchaseReturnVoucher-${purchaseReturn.referenceNo || purchaseReturn._id}.xlsx`);
  };

  if (React.Children.count(children) !== 1) {
      console.error("PurchaseReturnExcelDownload expects exactly one child element.");
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