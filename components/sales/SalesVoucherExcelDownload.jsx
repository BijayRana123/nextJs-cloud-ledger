import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default function SalesVoucherExcelDownload({ salesOrder, children }) {
  const handleDownload = () => {
    if (!salesOrder) return;

    const ws = XLSX.utils.json_to_sheet([
      {
        'Sales Voucher No': salesOrder.referenceNo,
        'Customer': salesOrder.customer?.name || 'N/A',
        'Date': salesOrder.date ? new Date(salesOrder.date).toLocaleDateString() : 'N/A',
        'Amount': salesOrder.totalAmount?.toFixed(2) || '0.00',
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesVoucher');
    XLSX.writeFile(wb, `SalesVoucher-${salesOrder.referenceNo || salesOrder._id}.xlsx`);
  };

  // Render children (the menu item) and attach the onClick handler
  // Need to clone the child element to add props
  if (React.Children.count(children) !== 1) {
      console.error("SalesVoucherExcelDownload expects exactly one child element.");
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