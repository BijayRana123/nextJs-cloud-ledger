"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";

// Import the purchase-related components
import CustomerSection from "@/app/components/sales/customer-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";

// Import the useOrganization hook
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function AddSalesBillPage() { // Keep the component name as AddSalesBillPage
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = useOrganization(); // Get organizationId from context

  const [formData, setFormData] = useState({
    customerName: '', // This should likely hold the customer ID
    referenceNo: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0], // Initialize with today's date
    dueDate: '',
    customerInvoiceReferenceNo: '',
    currency: 'Nepalese Rupee',
    exchangeRateToNPR: '1',
    isImport: false,
    items: [], // Array to hold product/service items
  });

  const [isEditing, setIsEditing] = useState(false); // State to indicate if we are in edit mode

  // Log the organizationId from context whenever it changes
  useEffect(() => {
    console.log("AddSalesBillPage: organizationId from context:", organizationId);
  }, [organizationId]);


  // Fetch purchase order data if editing (adapting from purchase bill logic)
  useEffect(() => {
    const customerOrderId = searchParams.get('id'); // Get the 'id' parameter
    setIsEditing(!!customerOrderId); // Set editing mode based on ID presence

    // Fetch purchase order data if ID is present (for editing)
    if (customerOrderId) {
      const fetchSalesOrder = async () => {
        try {
          const response = await fetch(`/api/organization/sales-orders/${customerOrderId}`);
          const result = await response.json();

          if (response.ok && result.salesOrder) {
            const so = result.salesOrder;
            // Map fetched data to formData structure
            setFormData({
              customerName: so.customer?._id || '', // Assuming customerName in formData should be the ID
              referenceNo: so.referenceNo || '',
              billNumber: so.billNumber || '',
              billDate: so.date ? new Date(so.date).toISOString().split('T')[0] : '', // Format date as YYYY-MM-DD
              dueDate: so.dueDate ? new Date(so.dueDate).toISOString().split('T')[0] : '', // Format date as YYYY-MM-DD
              customerInvoiceReferenceNo: so.customerInvoiceReferenceNo || '',
              currency: so.currency || 'Nepalese Rupee',
              exchangeRateToNPR: so.exchangeRateToNPR?.toString() || '1',
              isImport: so.isImport || false,
              items: so.items?.map(item => ({
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

      fetchSalesOrder();
    } else {
       // If no ID, initialize with an empty item for new purchase order
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

    const salesOrderId = searchParams.get('id'); // Get the 'id' parameter for updating

    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => {
      const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      // Add logic for discount and tax if needed in total calculation
      return sum + itemAmount;
    }, 0);

    // Map items to match the schema structure
    const salesOrderItems = formData.items.map(item => ({
      item: item.product, // Assuming 'product' holds the item ID (which should be ObjectId)
      quantity: parseFloat(item.qty) || 0,
      price: parseFloat(item.rate) || 0, // Assuming 'rate' is the price per item
      // Add other item fields if necessary and available in formData.items
    }));

    // Filter out items that do not have a product selected
    const validSalesOrderItems = salesOrderItems.filter(item => item.item);

    // Construct the data object to send to the API (for sales orders)
    const dataToSend = {
      organization: organizationId, // Use the organization ID from context
      // salesOrderNumber: `SO-${Date.now()}`, // Simple mock SO number, consider a proper sequence generator - Keep existing SO number if editing
      date: formData.billDate, // Mapping billDate to date
      customer: formData.customerName, // Using the selected customer ID (should also be ObjectId if backend expects it)
      items: validSalesOrderItems, // Use the filtered items
      totalAmount: totalAmount, // Note: totalAmount might need recalculation based on valid items
      // Include other relevant fields from formData if they exist in the schema
      referenceNo: formData.referenceNo,
      billNumber: formData.billNumber,
      dueDate: formData.dueDate,
      customerInvoiceReferenceNo: formData.customerInvoiceReferenceNo,
      currency: formData.currency,
      exchangeRateToNPR: parseFloat(formData.exchangeRateToNPR) || 1,
      isImport: formData.isImport,
    };

    console.log("Submitting Purchase Order (via Sales Bill Page):", dataToSend);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/organization/sales-orders/${salesOrderId}` : '/api/organization/sales-orders'; // Target sales order API

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
        console.log("Sales Order saved successfully (via Sales Bill Page):", result.salesOrder);
        // Redirect to the sales order detail page
        router.push(`/dashboard/sales/sales-orders/${result.salesOrder._id}`);
      } else {
        console.error("Error saving Sales Order (via Sales Bill Page):", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error saving Sales Order (via Sales Bill Page):", error);
      // TODO: Display a generic error message to the user
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Sales Bill' : 'Add New Sales Bill'}</h1> {/* Update title */}
        <div className="flex items-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmit} disabled={!organizationId}>Save</Button> {/* Disable save until org ID is loaded */}
          {/* TODO: Add actual close functionality */}
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Supplier Section Component */}
      <CustomerSection formData={formData} setFormData={setFormData} />

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
