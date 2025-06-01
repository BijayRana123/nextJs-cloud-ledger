import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default function SalesReturnVoucherExcelDownload({ salesOrder, children }) {
  const handleDownload = () => {
    if (!salesOrder) return;

    // Create main worksheet with summary information
    const summaryWs = XLSX.utils.json_to_sheet([
      {
        'Sales Return Voucher No': salesOrder.salesReturnNumber,
        'Customer': salesOrder.customer?.name || 'N/A',
        'Date': salesOrder.date ? new Date(salesOrder.date).toLocaleDateString() : 'N/A',
        'Due Date': salesOrder.dueDate ? new Date(salesOrder.dueDate).toLocaleDateString() : 'N/A',
        'Bill Number': salesOrder.billNumber || 'N/A',
        'Customer Invoice Ref': salesOrder.customerInvoiceReferenceNo || 'N/A',
        'Amount': salesOrder.totalAmount?.toFixed(2) || '0.00',
        'Currency': salesOrder.currency || 'NPR',
      }
    ]);

    // Create items worksheet with detailed item information
    const items = salesOrder.items?.map(item => ({
      'Product': item.item?.name || 'Unknown Product',
      'Quantity': item.quantity || 0,
      'Rate': (item.price || 0).toFixed(2),
      'Discount': (item.discount || 0).toFixed(2),
      'Tax': (item.tax || 0).toFixed(2),
      'Amount': ((item.quantity || 0) * (item.price || 0)).toFixed(2)
    })) || [];

    const itemsWs = XLSX.utils.json_to_sheet(items);

    // Create workbook and append worksheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, itemsWs, 'Items');
    
    // Write to file
    XLSX.writeFile(wb, `SalesReturnVoucher-${salesOrder.salesReturnNumber || salesOrder._id}.xlsx`);
  };

  // Render children (the menu item) and attach the onClick handler
  if (React.Children.count(children) !== 1) {
      console.error("SalesReturnVoucherExcelDownload expects exactly one child element.");
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