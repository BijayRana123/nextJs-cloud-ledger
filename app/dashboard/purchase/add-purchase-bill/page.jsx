"use client";



import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter } from 'next/navigation'; // Import useRouter

// Import the new components
import SupplierSection from "@/app/components/purchase/supplier-section";
import ItemsSection from "@/app/components/purchase/items-section";
import CalculationSection from "@/app/components/purchase/calculation-section";


export default function AddPurchaseBillPage() {
  const router = useRouter(); // Initialize router

  const [formData, setFormData] = useState({
    supplierName: '',
    referenceNo: '',
    billNumber: '',
    billDate: '',
    dueDate: '',
    supplierInvoiceReferenceNo: '',
    currency: 'Nepalese Rupee',
    exchangeRateToNPR: '1',
    isImport: false,
    items: [], // Array to hold product/service items
  });

  const [organizationId, setOrganizationId] = useState(null); // State to hold organization ID

  // Initialize with an empty item for better UX and fetch organization ID
  useEffect(() => {
    if (formData.items.length === 0) {
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, { product: '', productName: '', productCode: '', qty: '', rate: '', discount: '', tax: '', amount: '' }],
      }));
    }

    // Fetch organization ID
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/user/organizations');
        const result = await response.json();
        if (response.ok && result.organizations && result.organizations.length > 0) {
          // Assuming the user is associated with one organization for this context
          setOrganizationId(result.organizations[0]._id);
        } else {
          console.error("Failed to fetch organization ID:", result.message);
          // TODO: Handle error, maybe redirect or show a message
        }
      } catch (error) {
        console.error("Error fetching organization ID:", error);
        // TODO: Handle error
      }
    };

    fetchOrganization();

  }, []);


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
      console.error("Organization ID is not available. Cannot submit.");
      // TODO: Display an error message to the user
      return;
    }

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
      organization: organizationId, // Use the fetched organization ID
      purchaseOrderNumber: `PO-${Date.now()}`, // Simple mock PO number, consider a proper sequence generator
      date: formData.billDate, // Mapping billDate to date
      supplier: formData.supplierName, // Using the selected supplier ID (should also be ObjectId if backend expects it)
      items: validPurchaseOrderItems, // Use the filtered items
      totalAmount: totalAmount, // Note: totalAmount might need recalculation based on valid items
      // Include other relevant fields from formData if they exist in the schema
      referenceNo: formData.referenceNo,
      billNumber: formData.billNumber,
      dueDate: formData.dueDate,
      supplierInvoiceReferenceNo: formData.supplierInvoiceReferenceNo,
      currency: formData.currency,
      exchangeRateToNPR: parseFloat(formData.exchangeRateToNPR) || 1,
      isImport: formData.isImport,
    };

    console.log("Submitting Purchase Order:", dataToSend);

    try {
      const response = await fetch('/api/organization/purchase-orders', {
        method: 'POST',
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
        <h1 className="text-2xl font-bold">Add New Purchase Bill</h1>
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
              <Label htmlFor="billDate">Bill Date (BS) *</Label>
               <div className="flex items-center gap-7">
                 <NepaliDatePicker
                   className='w-full'
                   inputClassName="w-full"
                   value={formData.billDate}
                   onChange={(value) => handleSelectChange('billDate', value)}
                   options={{  calenderLocale: "ne", valueLocale: "en" }}
                   format="YYYY-MM-DD"
                 />
                 <CalendarIcon className="h-5 w-5 text-gray-500" />
               </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dueDate">Due Date (BS) *</Label>
               <div className="flex items-center gap-2">
                 <NepaliDatePicker
                   className='w-full'
                   inputClassName="w-full"
                   value={formData.dueDate}
                   onChange={(value) => handleSelectChange('dueDate', value)}
                   options={{ calenderCssClassName: 'custom-calendar-class',calenderLocale: "ne", valueLocale: "en" }}
                   format="YYYY-MM-DD"
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
