"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import CustomerSection from "@/app/components/sales/customer-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function AddSalesReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = useOrganization();

  const [formData, setFormData] = useState({
    customerName: '',
    referenceNo: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    customerInvoiceReferenceNo: '',
    currency: 'NPR',
    exchangeRateToNPR: '1',
    isImport: false,
    items: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nextSalesReturnRefNo, setNextSalesReturnRefNo] = useState('');

  useEffect(() => {
    const salesReturnId = searchParams.get('id');
    setIsEditing(!!salesReturnId);

    if (salesReturnId) {
      const fetchSalesReturn = async () => {
        try {
          const response = await fetch(`/api/organization/sales-return-vouchers/${salesReturnId}`);
          const result = await response.json();

          if (response.ok && result.salesReturn) {
            const sr = result.salesReturn;
            setFormData({
              customerName: sr.customer?._id || '',
              referenceNo: sr.referenceNo || '',
              billNumber: sr.returnNumber || '',
              billDate: sr.date ? new Date(sr.date).toISOString().split('T')[0] : '',
              customerInvoiceReferenceNo: sr.customerInvoiceReferenceNo || '',
              currency: sr.currency || 'NPR',
              exchangeRateToNPR: sr.exchangeRateToNPR?.toString() || '1',
              isImport: sr.isImport || false,
              items: sr.items?.map(item => ({
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
      fetchSalesReturn();
    } else {
      // Fetch next sales return reference number for new voucher (for preview only)
      const fetchNextSalesReturnRefNo = async () => {
        try {
          const response = await fetch('/api/accounting/counters/next?type=salesreturn');
          if (response.ok) {
            const data = await response.json();
            setNextSalesReturnRefNo(data.nextNumber);
          } else {
            setNextSalesReturnRefNo('SR-1001');
          }
        } catch (err) {
          setNextSalesReturnRefNo('SR-1001');
        }
      };
      fetchNextSalesReturnRefNo();
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
    const salesReturnId = searchParams.get('id');
    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + itemAmount;
    }, 0);
    const salesReturnItems = formData.items.map(item => ({
      item: item.product,
      quantity: parseFloat(item.qty) || 0,
      price: parseFloat(item.rate) || 0,
    }));
    const validSalesReturnItems = salesReturnItems.filter(item => item.item);
    const dataToSend = {
      organization: organizationId,
      date: formData.billDate,
      customer: formData.customerName,
      items: validSalesReturnItems,
      totalAmount: totalAmount,
      ...(isEditing ? { referenceNo: formData.referenceNo } : {}),
      returnNumber: formData.billNumber,
      customerInvoiceReferenceNo: formData.customerInvoiceReferenceNo,
      currency: 'NPR',
      exchangeRateToNPR: parseFloat(formData.exchangeRateToNPR) || 1,
      isImport: formData.isImport,
    };
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/organization/sales-return-vouchers` : '/api/organization/sales-return-vouchers';
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? { ...dataToSend, id: salesReturnId } : dataToSend),
      });
      const result = await response.json();
      if (response.ok) {
        // Redirect to the detail page if _id is available, else fallback to list
        const sr = result.salesReturn || result.salesReturnVoucher;
        if (sr && sr._id) {
          router.push(`/dashboard/sales/sales-return-vouchers/${sr._id}`);
        } else {
          router.push('/dashboard/sales/sales-return-vouchers');
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
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Sales Return Bill' : 'Add New Sales Return Bill'}</h1>
        <div className="flex items-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmit} disabled={!organizationId}>Save</Button>
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Customer Section */}
      <CustomerSection formData={formData} setFormData={setFormData} counterType="salesreturn" />

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