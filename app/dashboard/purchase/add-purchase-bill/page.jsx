"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";

// Import the new components
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";

// Import the useOrganization hook
import { useOrganization } from '@/lib/context/OrganizationContext';


export default function AddPurchaseBillPage() {
  const router = useRouter(); // Initialize router
  const searchParams = useSearchParams(); // Get search params
  const organizationId = useOrganization(); // Get organizationId from context

  const [formData, setFormData] = useState({
    supplierName: '',
    referenceNo: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'Nepalese Rupee',
    exchangeRateToNPR: '1',
    isImport: false,
    items: [],
  });

  const [isEditing, setIsEditing] = useState(false); // State to indicate if we are in edit mode

  // Log the organizationId from context whenever it changes
  useEffect(() => {
    console.log("AddPurchaseBillPage: organizationId from context:", organizationId);
  }, [organizationId]);


  // Fetch purchase order data if editing
  useEffect(() => {
    const purchaseOrderId = searchParams.get('id'); // Get the 'id' parameter
    setIsEditing(!!purchaseOrderId); // Set editing mode based on ID presence

    // Fetch purchase order data if ID is present (for editing)
    if (purchaseOrderId) {
      const fetchPurchaseOrder = async () => {
        try {
          const response = await fetch(`/api/organization/purchase-orders/${purchaseOrderId}`);
          const result = await response.json();

          if (response.ok && result.purchaseOrder) {
            const po = result.purchaseOrder;
            // Map fetched data to formData structure
            setFormData({
              supplierName: po.supplier?._id || '', // Assuming supplierName in formData should be the ID
              referenceNo: po.referenceNo || '',
              billDate: po.date ? new Date(po.date).toISOString().split('T')[0] : '', // Format date as YYYY-MM-DD
              dueDate: po.dueDate ? new Date(po.dueDate).toISOString().split('T')[0] : '', // Format date as YYYY-MM-DD
              currency: po.currency || 'Nepalese Rupee',
              exchangeRateToNPR: po.exchangeRateToNPR?.toString() || '1',
              isImport: po.isImport || false,
              items: po.items?.map(item => ({
                product: item.item?._id || '', // Item ID
                productName: item.item?.name || 'Unknown Product', // Item name
                productCode: item.item?._id || 'No Code', // Item code (using ID for now)
                qty: item.quantity?.toString() || '',
                rate: item.price?.toString() || '',
                discount: item.discount?.toString() || '',
                tax: item.tax?.toString() || '',
                amount: ((item.quantity || 0) * (parseFloat(item.rate) || 0)).toString() || '', // Calculate amount
              })) || [],
            });
          } else {
            console.error("Failed to fetch purchase order for editing:", result.message);
            // TODO: Handle error, maybe show a message or redirect
          }
        } catch (error) {
          console.error("Error fetching purchase order for editing:", error);
          // TODO: Handle error
        }
      };

      fetchPurchaseOrder();
    } else {
      // If not editing, fetch the next reference number
      fetch('/api/accounting/counters/next?type=purchase')
        .then(res => res.json())
        .then(data => {
          if (data.nextNumber) {
            setFormData(prev => ({ ...prev, referenceNo: data.nextNumber }));
          }
        });
      if (formData.items.length === 0) {
        setFormData((prev) => ({
          ...prev,
          items: [...prev.items, { product: '', productName: '', productCode: '', qty: '', rate: '', discount: '', tax: '', amount: '' }],
        }));
      }
    }

  }, [searchParams]); // Add searchParams as a dependency


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
      console.error("Organization ID is not available from context. Cannot submit.");
      // TODO: Display an error message to the user
      return;
    }

    const purchaseOrderId = searchParams.get('id'); // Get the 'id' parameter for updating

    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      // Add logic for discount and tax if needed in total calculation
      return sum + itemAmount;
    }, 0);

    // Map items to match the schema structure
    const purchaseOrderItems = formData.items.map(item => ({
      item: item.product, // Assuming 'product' holds the item ID (which should be ObjectId)
      quantity: parseFloat(item.qty) || 0,
      price: parseFloat(item.rate) || 0, // Assuming 'rate' is the price per item
      // Add other item fields if necessary and available in formData.items
    }));

    // Filter out items that do not have a product selected
    const validPurchaseOrderItems = purchaseOrderItems.filter(item => item.item);

    // Construct the data object to send to the API
    const dataToSend = {
      organization: organizationId,
      date: formData.billDate,
      supplier: formData.supplierName,
      items: validPurchaseOrderItems,
      totalAmount: totalAmount,
      referenceNo: formData.referenceNo,
      dueDate: formData.dueDate,
      currency: formData.currency,
      exchangeRateToNPR: parseFloat(formData.exchangeRateToNPR) || 1,
      isImport: formData.isImport,
    };

    console.log("Submitting Purchase Order:", dataToSend);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/organization/purchase-orders/${purchaseOrderId}` : '/api/organization/purchase-orders';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Purchase Order saved successfully:", result.purchaseOrder);
        // Redirect to the purchase order detail page
        router.push(`/dashboard/purchase/purchase-orders/${result.purchaseOrder._id}`);
      } else {
        console.error("Error saving Purchase Order:", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error saving Purchase Order:", error);
      // TODO: Display a generic error message to the user
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Purchase Bill' : 'Add New Purchase Bill'}</h1>
        <div className="flex items-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmit} disabled={!organizationId}>Save</Button> {/* Disable save until org ID is loaded */}
          {/* TODO: Add actual close functionality */}
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Supplier Section Component */}
      <SupplierSection formData={formData} setFormData={setFormData} />

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


      {/* Items Section Component */}
      <ItemsSection formData={formData} setFormData={setFormData} />

      {/* Calculation Section Component */}
      <CalculationSection items={formData.items} />

    </div>
  );
}
