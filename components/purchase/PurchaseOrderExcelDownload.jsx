import React from 'react';
import * as XLSX from 'xlsx';

export default function PurchaseOrderExcelDownload({ purchaseOrder, children }) {
  const handleDownload = () => {
    if (!purchaseOrder) return;

    const ws = XLSX.utils.json_to_sheet([
      {
        'Purchase Voucher Reference No': purchaseOrder.referenceNo,
        'Supplier': purchaseOrder.supplier?.name || 'N/A',
        'Date': purchaseOrder.date ? new Date(purchaseOrder.date).toLocaleDateString() : 'N/A',
        'Due Date': purchaseOrder.dueDate ? new Date(purchaseOrder.dueDate).toLocaleDateString() : 'N/A',
        'Supplier Bill No': purchaseOrder.supplierBillNo || 'N/A',
        'Amount': purchaseOrder.totalAmount?.toFixed(2) || '0.00',
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PurchaseVoucher');
    XLSX.writeFile(wb, `PurchaseVoucher-${purchaseOrder.referenceNo || purchaseOrder._id}.xlsx`);
  };

  if (React.Children.count(children) !== 1) {
      console.error("PurchaseOrderExcelDownload expects exactly one child element.");
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
