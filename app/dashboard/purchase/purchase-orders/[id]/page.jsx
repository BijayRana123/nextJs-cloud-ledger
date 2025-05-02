"use client";
import EmailModal from "@/app/components/email-modal";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Import custom table components
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";

// Import components that might be reused for display
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";


export default function PurchaseOrderDetailPage() {
  const { id } = useParams(); // Get the purchase order ID from the URL
  const router = useRouter(); // Get router instance
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const [approveError, setApproveError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const fetchPurchaseOrder = async () => {
    setIsLoading(true);
    setError(null);
    setDeleteSuccess(false); // Reset messages on ID change
    setDeleteError(null);
    setApproveSuccess(false);
    setApproveError(null);

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

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]); // Refetch if ID changes

  // Log purchaseOrder state after it's updated
  useEffect(() => {
    console.log("Purchase Order state updated:", purchaseOrder);
  }, [purchaseOrder]);

  const handleApprove = async () => {
    setIsApproving(true);
    setApproveError(null);
    setApproveSuccess(false);
    try {
      const response = await fetch(`/api/organization/purchase-orders/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setApproveSuccess(true);
        // Optionally refetch the purchase order to update its status
        fetchPurchaseOrder(); // Refetch to show updated status
      } else {
        let errorData = {};
        try {
          // Attempt to parse the error response as JSON
          errorData = await response.json();
          console.error("API Error Response (JSON):", errorData);
        } catch (jsonError) {
          // If JSON parsing fails, read as text
          const errorText = await response.text();
          console.error("API Error Response (Text):", errorText);
          errorData.message = errorText; // Use the text as the message
        }

        // Use the error message from the backend if available, otherwise use status text
        const errorMessage = errorData.error || errorData.message || response.statusText || 'No error message provided';
        setApproveError(`Failed to approve purchase order: ${response.status} - ${errorMessage}`);
      }
    } catch (err) {
      console.error("Error approving purchase order:", err);
      setApproveError(`An error occurred while approving the purchase order: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true); // Show delete confirmation dialog
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);
    try {
      const response = await fetch(`/api/organization/purchase-orders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Redirect to purchase bills page after successful deletion
        router.push('/dashboard/purchase/purchase-bills');
      } else {
        const result = await response.json();
        setDeleteError(result.message || "Failed to delete purchase order");
      }
    } catch (err) {
      console.error("Error deleting purchase order:", err);
      setDeleteError("An error occurred while deleting the purchase order.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false); // Close dialog regardless of success/failure
    }
  };

  // handlePrint is no longer needed as we are generating PDF
  // const handlePrint = () => {
  //   // Trigger browser print functionality
  //   window.print();
  //   // Redirect to purchase bills page after printing
  //   router.push('/dashboard/purchase/purchase-bills');
  //   setShowPrintDialog(false); // Close print dialog after triggering print
  // };


  if (isLoading) {
    return <div className="p-4">Loading purchase order...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!purchaseOrder) {
    return <div className="p-4">Purchase order not found.</div>;
  }

  // Display success/error messages
  if (deleteSuccess) {
    return <div className="p-4 text-green-600">Purchase order successfully deleted. Redirecting...</div>;
  }

  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting purchase order: {deleteError}</div>;
  }

  if (approveSuccess) {
     // This message will be briefly shown before the print dialog appears
     // A toast notification might be better for this
     // return <div className="p-4 text-green-600">Purchase order approved and saved as bill.</div>;
  }

   if (approveError) {
    return <div className="p-4 text-red-600">Error approving purchase order: {approveError}</div>;
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
        <div className="flex items-center gap-4">
           {/* Conditionally render buttons based on purchase order status and loading state */}
           {!isLoading && purchaseOrder && (
             <>
               {purchaseOrder.status === 'DRAFT' && (
                 <>
                   <Button variant="outline" onClick={() => router.push(`/dashboard/purchase/add-purchase-bill?id=${id}`)}>Edit</Button>
                   <Button
                     className="bg-green-500 hover:bg-green-600"
                     onClick={handleApprove}
                     disabled={isApproving}
                   >
                     {isApproving ? 'Approving...' : 'Approve'}
                   </Button>
                   <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
                     {isDeleting ? 'Deleting...' : <XIcon className="h-5 w-5" />}
                   </Button> {/* Close button */}
                 </>
               )}
               {purchaseOrder.status === 'APPROVED' && (
                 <>
                   <Button variant="outline" onClick={() => setIsEmailModalOpen(true)}>Send Email</Button>
                   {/* Add Print button that links to the print page */}
                   <Button variant="outline" onClick={() => router.push(`/dashboard/purchase/purchase-orders/${id}/print`)}>Print</Button>
                   {/* Commented out server-side PDF generation as react-to-print is used for client-side printing */}
                   {/*
                   <Button variant="outline" onClick={async () => {
                     try {
                       const response = await fetch(`/api/organization/purchase-orders/${id}/generate-pdf`);
                       if (!response.ok) {
                         throw new Error('Failed to generate PDF');
                       }
                       const blob = await response.blob();
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `purchase-order-${id}.pdf`;
                       document.body.appendChild(a);
                       a.click();
                       a.remove();
                       window.URL.revokeObjectURL(url);

                       // Redirect to purchase bills page after triggering download
                       router.push('/dashboard/purchase/purchase-bills');

                     } catch (error) {
                       console.error('Error generating PDF:', error);
                       // Optionally show an error message to the user
                       alert('Failed to generate PDF. Please try again.');
                     }
                   }}>Download PDF</Button>
                   */}
                   <Button onClick={() => router.push('/dashboard/purchase/add-purchase-bill')}>Add New</Button>
                 </>
               )}
             </>
           )}
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
            <div>
              {typeof supplier === 'object' && supplier.name ? supplier.name :
               typeof supplier === 'string' ? `Supplier ID: ${supplier}` : 'N/A'}
            </div>
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
                    <CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product / Service</CustomTableHead><CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</CustomTableHead><CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</CustomTableHead><CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</CustomTableHead><CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</CustomTableHead><CustomTableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</CustomTableHead>
                  </CustomTableRow>
                </CustomTableHeader>
                <CustomTableBody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <CustomTableRow key={index}>
                      <CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName} {item.productCode !== 'No Code' && `(${item.productCode})`}
                      </CustomTableCell><CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.qty}
                      </CustomTableCell><CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof item.rate === 'number' ? item.rate.toFixed(2) : item.rate}
                      </CustomTableCell><CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.discount ? `${item.discount}%` : '0%'}
                      </CustomTableCell><CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.tax ? `${item.tax}%` : '0%'}
                      </CustomTableCell><CustomTableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        purchaseOrderId={id} // Pass the purchase order ID
        onEmailSent={() => router.push('/dashboard/purchase/purchase-orders')} // Redirect after email sent
      />
    </div>
  );
}
