"use client";

import { useState, useEffect, Suspense } from 'react';
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ConditionalDatePicker } from "@/components/ConditionalDatePicker";
import CustomerSection from "@/components/sales/customer-section";
import ItemsSection from "@/components/purchase/items-section";
import CalculationSection from "@/components/purchase/calculation-section";
import { useOrganization } from '@/lib/context/OrganizationContext';
import AddCustomerModal from "@/components/sales/add-customer-modal";
import StockWarningModal from "@/components/StockWarningModal";

export function AddSalesBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?._id;
  const organizationName = currentOrganization?.name;

  const [formData, setFormData] = useState({
    customerName: '',
    referenceNo: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    customerInvoiceReferenceNo: '',
    currency: 'NPR',
    exchangeRateToNPR: '1',
    isImport: false,
    items: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    stockErrors: [],
    stockWarnings: [],
    allowBypass: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const salesVoucherId = searchParams.get('id');
    setIsEditing(!!salesVoucherId);

    if (salesVoucherId) {
      const fetchSalesVoucher = async () => {
        try {
          const response = await fetch(`/api/organization/sales-vouchers/${salesVoucherId}`);
          const result = await response.json();

          if (response.ok && result.salesVoucher) {
            const sv = result.salesVoucher;
            setFormData({
              customerName: sv.customer?._id || '',
              referenceNo: sv.referenceNo || '',
              billNumber: sv.salesVoucherNumber || sv.billNumber || '',
              billDate: sv.date ? new Date(sv.date).toISOString().split('T')[0] : '',
              dueDate: sv.dueDate ? new Date(sv.dueDate).toISOString().split('T')[0] : '',
              customerInvoiceReferenceNo: sv.customerInvoiceReferenceNo || '',
              currency: sv.currency || 'NPR',
              exchangeRateToNPR: sv.exchangeRateToNPR?.toString() || '1',
              isImport: sv.isImport || false,
              items: sv.items?.map(item => ({
                product: item.item?._id || '',
                productName: item.item?.name || 'Unknown Product',
                productCode: item.item?._id || 'No Code',
                qty: item.quantity?.toString() || '',
                rate: item.price?.toString() || '',
                discount: item.discount?.toString() || '',
                tax: item.tax?.toString() || '',
                amount: ((item.quantity || 0) * (parseFloat(item.rate) || 0)).toString() || '',
              })) || [],
            });
          } else {
            // handle error
          }
        } catch (error) {
          // handle error
        }
      };
      fetchSalesVoucher();
    } else {
      if (formData.items.length === 0) {
        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, { product: '', productName: '', productCode: '', qty: '', rate: '', discount: '', tax: '', amount: '' }],
        }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organizationId || !organizationName) {
      alert('Please select an organization first');
      return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await submitSalesVoucher();
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Error creating sales voucher: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to actually submit the sales voucher
  const submitSalesVoucher = async (bypassStockValidation = false) => {
    const salesVoucherId = searchParams.get('id');
    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + itemAmount;
    }, 0);
    const salesVoucherItems = formData.items.map(item => ({
      item: item.product,
      quantity: parseFloat(item.qty) || 0,
      price: parseFloat(item.rate) || 0,
    }));
    const validSalesVoucherItems = salesVoucherItems.filter(item => item.item);
    const dataToSend = {
      organization: organizationId,
      organizationName,
      date: formData.billDate,
      customer: formData.customerName,
      items: validSalesVoucherItems,
      totalAmount: totalAmount,
      ...(isEditing ? { referenceNo: formData.referenceNo } : {}),
      dueDate: formData.dueDate,
      customerInvoiceReferenceNo: formData.customerInvoiceReferenceNo,
      currency: 'NPR',
      exchangeRateToNPR: parseFloat(formData.exchangeRateToNPR) || 1,
      isImport: formData.isImport,
      bypassStockValidation: bypassStockValidation,
    };
    
    const method = isEditing ? 'PUT' : 'POST';
    const url = '/api/organization/sales-vouchers';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? { ...dataToSend, id: salesVoucherId } : dataToSend),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Success - check if there are stock warnings in the response
        if (result.stockWarnings && result.stockWarnings.length > 0) {
          alert(`Sales voucher created successfully!\n\nStock warnings:\n${result.stockWarnings.map(w => `- ${w.itemName}: ${w.remainingAfterSale} remaining`).join('\n')}`);
        } else {
          alert('Sales voucher created successfully!');
        }
        
        const sv = result.salesVoucher;
        if (sv && sv._id) {
          router.push(`/dashboard/sales/sales-vouchers/${sv._id}`);
        } else {
          router.push('/dashboard/sales/sales-vouchers');
        }
      } else {
        // Handle API errors - Check if it's a stock validation error
        if (response.status === 400 && (result.stockErrors || result.message === "Insufficient stock for sale")) {
          setStockModal({
            isOpen: true,
            stockErrors: result.stockErrors || [],
            stockWarnings: result.stockWarnings || [],
            allowBypass: result.bypassOption || false
          });
        } else {
          alert('Error: ' + (result.message || 'Failed to create sales voucher'));
        }
      }
    } catch (error) {
      console.error('Error submitting sales voucher:', error);
      alert('Error creating sales voucher: ' + error.message);
    }
  };

  // Add handler for when a new customer is created from the modal
  const handleCustomerCreated = (customer) => {
    setFormData((prev) => ({ ...prev, customerName: customer._id }));
    setIsAddCustomerModalOpen(false);
    // Optionally: trigger a refresh in CustomerSection if needed
  };

  // Handle proceeding despite warnings (this won't be shown for errors)
  const handleProceedWithWarnings = async () => {
    setStockModal({ isOpen: false, stockErrors: [], stockWarnings: [], allowBypass: false });
    // Note: This would only be called for warnings, not errors
    // The submitSalesVoucher should be called again here if needed
  };

  // Handle force submit with bypass (for stock errors)
  const handleForceSubmit = async () => {
    setStockModal({ isOpen: false, stockErrors: [], stockWarnings: [], allowBypass: false });
    setIsSubmitting(true);
    
    try {
      await submitSalesVoucher(true); // bypass stock validation
    } catch (error) {
      console.error('Error during force submission:', error);
      alert('Error creating sales voucher: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle closing the stock modal
  const handleCloseStockModal = () => {
    setStockModal({ isOpen: false, stockErrors: [], stockWarnings: [], allowBypass: false });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Sales Voucher' : 'Add New Sales Voucher'}</h1>
        <div className="flex items-center gap-4">
          <Button 
            className="bg-green-500 hover:bg-green-600" 
            onClick={handleSubmit} 
            disabled={!organizationId || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>
      {/* Add New Customer Button
      <div className="mb-4">
        <Button variant="outline" onClick={() => setIsAddCustomerModalOpen(true)}>
          + Add New Customer
        </Button>
      </div> */}
      <AddCustomerModal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} onCustomerCreated={handleCustomerCreated} />
      {/* Customer Section with Sales Voucher No at top right */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerSection formData={formData} setFormData={setFormData} counterType="sales" voucherNumber={formData.billNumber} />
        </CardContent>
      </Card>

      {/* Remove Sales Voucher No from here, keep Bill Date and Due Date */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="billDate">Bill Date</Label>
              <div className="flex items-center gap-2">
                <ConditionalDatePicker
                  id="billDate"
                  name="billDate"
                  value={formData.billDate}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="flex items-center gap-2">
                <ConditionalDatePicker
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <ItemsSection formData={formData} setFormData={setFormData} />

      {/* Calculation Section */}
      <CalculationSection items={formData.items} />

      {/* Stock Warning Modal */}
      <StockWarningModal
        isOpen={stockModal.isOpen}
        onClose={handleCloseStockModal}
        onProceed={handleProceedWithWarnings}
        onForceSubmit={handleForceSubmit}
        stockErrors={stockModal.stockErrors}
        stockWarnings={stockModal.stockWarnings}
        allowBypass={stockModal.allowBypass}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddSalesBillPage />
    </Suspense>
  );
}
