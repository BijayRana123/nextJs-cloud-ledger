"use client";
import EmailModal from "@/app/components/email-modal";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCookie } from '@/lib/utils';

// Import custom table components
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";

// Import components that might be reused for display
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";
import { useCalendar } from "@/lib/context/CalendarContext";
import { Printer, FileEdit, Trash2, CheckCircle, Mail, MoreVertical, FileSpreadsheet, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import PurchaseOrderExcelDownload from "@/components/purchase/PurchaseOrderExcelDownload";
import PurchaseOrderPdfDownload from "@/components/purchase/PurchaseOrderPdfDownload";

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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { isNepaliCalendar } = useCalendar();
  const [emailOrder, setEmailOrder] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [generatePdfBase64, setGeneratePdfBase64] = useState(null);

  const fetchPurchaseOrder = async () => {
    setIsLoading(true);
    setError(null);
    setDeleteSuccess(false); // Reset messages on ID change
    setDeleteError(null);
    setApproveSuccess(false);
    setApproveError(null);

    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (response.ok) {

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



  useEffect(() => {
    import('@/app/dashboard/sales/sales-vouchers-details/[id]/print/generatePdfBase64')
      .then(module => setGeneratePdfBase64(() => module.generatePdfBase64))
      .catch(error => console.error('Failed to load PDF generation module:', error));
  }, []);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/organization/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
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

  const handlePrint = () => {
    if (purchaseOrder) {
      window.open(`/dashboard/purchase/purchase-orders/${purchaseOrder._id}/print`, '_blank');
    }
  };

  const handleEmailClick = async () => {
    if (purchaseOrder) {
      setEmailOrder(purchaseOrder);
      setIsEmailModalOpen(true);
      if (generatePdfBase64) {
        const pdfUrl = await generatePdfBase64(purchaseOrder);
        setPdfPreviewUrl(pdfUrl);
      }
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading purchase voucher...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!purchaseOrder) {
    return <div className="p-4">Purchase order not found.</div>;
  }

  // Display success/error messages
  if (deleteSuccess) {
    return <div className="p-4 text-green-600">Purchase voucher successfully deleted. Redirecting...</div>;
  }

  if (deleteError) {
    return <div className="p-4 text-red-600">Error deleting purchase voucher: {deleteError}</div>;
  }

  if (approveSuccess) {
     // This message will be briefly shown before the print dialog appears
     // A toast notification might be better for this
     // return <div className="p-4 text-green-600">Purchase order approved and saved as bill.</div>;
  }

   if (approveError) {
    return <div className="p-4 text-red-600">Error approving purchase voucher: {approveError}</div>;
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
    items: purchaseItems,
    totalAmount,
    notes,
    status
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Voucher Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/purchase/purchase-bills')}>
            Back to Purchase Vouchers
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/purchase/add-purchase-bill')}>
            + Add New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/purchase/add-purchase-bill?id=${id}`)}>
                <FileEdit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <PurchaseOrderExcelDownload purchaseOrder={purchaseOrder}>
                    <DropdownMenuItem>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </DropdownMenuItem>
                  </PurchaseOrderExcelDownload>
                  <PurchaseOrderPdfDownload purchaseOrder={purchaseOrder}>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </DropdownMenuItem>
                  </PurchaseOrderPdfDownload>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Mail className="mr-2 h-4 w-4" /> Email
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={handleEmailClick}>
                    Email Purchase Order
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Display Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Purchase Voucher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <div>{purchaseOrder.dueDate ? new Date(purchaseOrder.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Voucher Reference No:</span>
                  <div>{purchaseOrder.referenceNo || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier Bill No:</span>
                  <div>{purchaseOrder.supplierBillNo || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Supplier Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <div>{supplierName || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address:</span>
                  <div>{supplier?.address || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PAN:</span>
                  <div>{supplier?.pan || 'N/A'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <div>{supplier?.phoneNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {isImport && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Import Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency:</span>
                  <div>{currency || 'NPR'}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Exchange Rate to NPR:</span>
                  <div>{exchangeRateToNPR || '1'}</div>
                </div>
              </div>
            </div>
          )}
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
      {isEmailModalOpen && emailOrder && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          purchaseOrder={emailOrder}
          pdfPreviewUrl={pdfPreviewUrl}
          pdfFileName={`PurchaseVoucher-${emailOrder?.referenceNo || emailOrder?._id}.pdf`}
        />
      )}
    </div>
  );
}
