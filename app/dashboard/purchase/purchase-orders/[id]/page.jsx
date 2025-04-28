"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

// Import custom table components
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";

// Import components that might be reused for display
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";


export default function PurchaseOrderDetailPage() {
  const { id } = useParams(); // Get the purchase order ID from the URL
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchPurchaseOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/organization/purchase-orders/${id}`);
          const result = await response.json();

          if (response.ok) {
            console.log("API Response:", result);
            console.log("Purchase Order Data:", result.purchaseOrder);
            setPurchaseOrder(result.purchaseOrder);
          } else {
            console.error("API Error:", result);
            setError(result.message || "Failed to fetch purchase order");
          }
        } catch (err) {
          console.error("Error fetching purchase order:", err);
          setError("An error occurred while fetching the purchase order.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchPurchaseOrder();
    }
  }, [id]); // Refetch if ID changes

  if (isLoading) {
    return <div className="p-4">Loading purchase order...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!purchaseOrder) {
    return <div className="p-4">Purchase order not found.</div>;
  }

  // Extract data from the purchaseOrder object
  // Map the database fields to the display fields
  const {
    supplier,
    purchaseOrderNumber,
    date,
    dueDate,
    referenceNo,
    billNumber,
    supplierInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isImport,
    items: purchaseItems
  } = purchaseOrder;
  
  // Format the items array for display
  const items = purchaseItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'No Code',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    tax: item.tax || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];
  
  // Get supplier name
  const supplierName = typeof supplier === 'object' ? supplier.name : supplier;
  
 

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Order Details</h1>
        {/* TODO: Add actions like Edit, Approve, Send Email, Print Preview */}
        <div className="flex items-center gap-4">
           <Button variant="outline">Edit</Button>
           <Button className="bg-green-500 hover:bg-green-600">Approve</Button>
           <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button> {/* Close button */}
        </div>
      </div>

      {/* Display Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Supplier Name</Label>
            <div>{supplierName || 'N/A'}</div>
          </div>
          <div>
            <Label>Purchase Order Number</Label>
            <div>{purchaseOrderNumber || 'N/A'}</div>
          </div>
          <div>
            <Label>Reference</Label>
            <div>{referenceNo || 'N/A'}</div>
          </div>
          <div>
            <Label>Bill Number</Label>
            <div>{billNumber || 'N/A'}</div>
          </div>
          <div>
            <Label>Date</Label>
            <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div>
            <Label>Due Date</Label>
            <div>{dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div>
            <Label>Supplier Invoice Reference No</Label>
            <div>{supplierInvoiceReferenceNo || 'N/A'}</div>
          </div>
          <div>
            <Label>Currency</Label>
            <div>{currency || 'NPR'}</div>
          </div>
          <div>
            <Label>Exchange Rate to NPR</Label>
            <div>{exchangeRateToNPR || '1'}</div>
          </div>
          <div>
            <Label>Is Import</Label>
            <div>{isImport ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <Label>Total Amount</Label>
            <div>{purchaseOrder.totalAmount ? `${purchaseOrder.totalAmount.toFixed(2)}` : 'N/A'}</div>
          </div>
        </CardContent>
      </Card>


      {/* Display Items Section (Reusing ItemsSection component - might need adaptation for display-only) */}
      {/* For now, just displaying items data directly */}
       <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
           {items && items.length > 0 ? (
              <CustomTable className="min-w-full divide-y divide-gray-200">
                <CustomTableHeader className="bg-gray-50">
                  <CustomTableRow>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product / Service</CustomTableHead>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</CustomTableHead>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</CustomTableHead>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</CustomTableHead>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</CustomTableHead>
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</CustomTableHead>
                  </CustomTableRow>
                </CustomTableHeader>
                <CustomTableBody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <CustomTableRow key={index}>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName} {item.productCode && `(${item.productCode})`}
                      </CustomTableCell>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.qty}
                      </CustomTableCell>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof item.rate === 'number' ? item.rate.toFixed(2) : item.rate}
                      </CustomTableCell>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.discount ? `${item.discount}%` : '0%'}
                      </CustomTableCell>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.tax ? `${item.tax}%` : '0%'}
                      </CustomTableCell>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount}
                      </CustomTableCell>
                    </CustomTableRow>
                  ))}
                </CustomTableBody>
              </CustomTable>
           ) : (
             <div className="text-gray-500">No items added.</div>
           )}
        </CardContent>
       </Card>


      {/* Display Calculation Section (Reusing CalculationSection component) */}
      {/* CalculationSection component should work for display as it only takes items prop */}
      {items && <CalculationSection items={items} />}

    </div>
  );
}
