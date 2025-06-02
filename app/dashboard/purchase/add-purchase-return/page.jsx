"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function AddPurchaseReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = useOrganization();

  const [formData, setFormData] = useState({
    supplierName: '',
    referenceNo: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    isExport: false,
    items: [],
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const purchaseReturnId = searchParams.get('id');
    setIsEditing(!!purchaseReturnId);

    if (purchaseReturnId) {
      const fetchPurchaseReturn = async () => {
        try {
          const response = await fetch(`/api/organization/purchase-return-vouchers/${purchaseReturnId}`);
          const result = await response.json();

          if (response.ok && result.purchaseReturn) {
            const pr = result.purchaseReturn;
            setFormData({
              supplierName: pr.supplier?._id || '',
              referenceNo: pr.referenceNo || '',
              billNumber: pr.billNumber || '',
              billDate: pr.date ? new Date(pr.date).toISOString().split('T')[0] : '',
              isExport: pr.isExport || false,
              items: pr.items?.map(item => ({
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
      fetchPurchaseReturn();
    } else {
      // Fetch the next purchase return reference number (now uses 'purchasereturn' for PRV- prefix)
      fetch('/api/accounting/counters/next?type=purchasereturn')
        .then(res => res.json())
        .then(data => {
          if (data.nextNumber) {
            setFormData(prev => ({ ...prev, referenceNo: data.nextNumber }));
          }
        });
      // If redirected from a purchase order, populate billNumber from supplierBillNo
      const purchaseOrderId = searchParams.get('purchaseOrderId');
      if (purchaseOrderId) {
        fetch(`/api/organization/purchase-orders/${purchaseOrderId}`)
          .then(res => res.json())
          .then(data => {
            if (data.purchaseOrder && data.purchaseOrder.supplierBillNo) {
              setFormData(prev => ({ ...prev, billNumber: data.purchaseOrder.supplierBillNo }));
            }
          });
      }
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
    if (!organizationId) {
      return;
    }
    const purchaseReturnId = searchParams.get('id');
    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + itemAmount;
    }, 0);
    const purchaseReturnItems = formData.items.map(item => ({
      item: item.product,
      quantity: parseFloat(item.qty) || 0,
      price: parseFloat(item.rate) || 0,
    }));
    const validPurchaseReturnItems = purchaseReturnItems.filter(item => item.item);
    const dataToSend = {
      organization: organizationId,
      date: formData.billDate,
      supplier: formData.supplierName,
      items: validPurchaseReturnItems,
      totalAmount: totalAmount,
      referenceNo: formData.referenceNo,
      billNumber: formData.billNumber,
      isExport: formData.isExport,
    };
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/organization/purchase-return-vouchers` : '/api/organization/purchase-return-vouchers';
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? { ...dataToSend, id: purchaseReturnId } : dataToSend),
      });
      const result = await response.json();
      if (response.ok) {
        // Redirect to the detail page if _id is available, else fallback to list
        const pr = result.purchaseReturn || result.purchaseReturnVoucher;
        if (pr && pr._id) {
          router.push(`/dashboard/purchase/purchase-return-vouchers/${pr._id}`);
        } else {
          router.push('/dashboard/purchase/purchase-return-vouchers');
        }
      } else {
        // handle error
      }
    } catch (error) {
      // handle error
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Purchase Return Bill' : 'Add New Purchase Return Bill'}</h1>
        <div className="flex items-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmit} disabled={!organizationId}>Save</Button>
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Supplier Section */}
      <SupplierSection formData={formData} setFormData={setFormData}>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="billNumber">Purchase Return Bill No</Label>
          <input
            id="billNumber"
            name="billNumber"
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter purchase return bill number"
            value={formData.billNumber}
            onChange={handleInputChange}
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="referenceNo">Purchase Return Voucher Reference No</Label>
          <input
            id="referenceNo"
            name="referenceNo"
            type="text"
            className="w-full border rounded px-3 py-2 bg-gray-100"
            placeholder="Auto-generated purchase return voucher reference number"
            value={formData.referenceNo}
            readOnly
          />
        </div>
      </SupplierSection>

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
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <ItemsSection formData={formData} setFormData={setFormData} />

      {/* Calculation Section */}
      <CalculationSection items={formData.items} />
    </div>
  );
} 