"use client";

import { useState, useEffect } from 'react'; // Import useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NepaliDatePicker } from 'nepali-datepicker-reactjs'; // Import the Nepali Date Picker component
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable"; // Import custom table components
import { CalendarIcon, XIcon, SearchIcon } from "lucide-react"; // Icons
import { Combobox } from "@/components/ui/combobox";

export default function AddPurchaseBillPage() {
  // Using dynamic import with next/dynamic for client-side only rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    supplierName: '',
    referenceNo: '',
    billNumber: '',
    billDate: '', // Reverted to ''
    dueDate: '', // Reverted to ''
    supplierInvoiceReferenceNo: '',
    currency: 'Nepalese Rupee', // Default currency
    exchangeRateToNPR: '1', // Default exchange rate
    isImport: false,
    items: [], // Array to hold product/service items
  });

  // Initialize with an empty item for better UX
  useEffect(() => {
    if (mounted && formData.items.length === 0) {
      handleAddItem();
    }
  }, [mounted]); // Only run this effect when mounted

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

  const handleAddItem = () => {
    // Add a new empty item to the items array
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { product: '', qty: '', rate: '', discount: '', tax: '', amount: '' }],
    }));
  };

  const handleItemInputChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    // TODO: Implement calculation for amount based on qty, rate, discount, tax
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log("Submitting Purchase Bill:", formData);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Purchase Bill</h1>
        <div className="flex items-center gap-4">
          <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmit}>Save</Button>
          {/* TODO: Add actual close functionality */}
          <Button variant="ghost" size="icon"><XIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              {/* Replace Input with Combobox */}
              <Combobox
               className="w-full"
                options={[
                  { value: "supplier1", label: "Aakrist pathak (Customer)" }, // Example data
                  { value: "supplier2", label: "Aayush Stores (Supplier)" },
                  { value: "supplier3", label: "ABC Associates Pvt Ltd (Supplier)" },
                  { value: "supplier4", label: "abc chinese company (Supplier)" },
                  { value: "supplier5", label: "ABC Fabrics (Supplier)" },
                  { value: "supplier6", label: "ABC metal (Supplier)" },
                ]}
                value={formData.supplierName}
                onValueChange={(value) => handleSelectChange('supplierName', value)}
                placeholder="Select Supplier"
               
              />
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="referenceNo">Reference No</Label>
              <div className="flex items-center gap-2">
                 <Input id="referenceNo" placeholder="Reference" value={formData.referenceNo} onChange={handleInputChange} />
                 <SearchIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input id="billNumber" placeholder="Bill Number" value={formData.billNumber} onChange={handleInputChange} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="billDate">Bill Date (BS) *</Label> {/* Updated label */}
               <div className="flex items-center gap-7">
                 {/* Replace standard date input with NepaliDatePicker */}
                 <NepaliDatePicker
                   className='w-full'
                   inputClassName="w-full" // Apply styling similar to Input
                   value={formData.billDate}
                   onChange={(value) => handleSelectChange('billDate', value)} // Use handleSelectChange for consistency
                   options={{  calenderLocale: "ne", valueLocale: "en" }} // Optional: Add custom class
                   format="YYYY-MM-DD" // Added format prop (adjust format as needed for BS)
                 />
                 <CalendarIcon className="h-5 w-5 text-gray-500" />
               </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dueDate">Due Date (BS) *</Label> {/* Updated label */}
               <div className="flex items-center gap-2">
                 {/* Replace standard date input with NepaliDatePicker */}
                 <NepaliDatePicker
                   className='w-full'
                   inputClassName="w-full" // Apply styling similar to Input
                   value={formData.dueDate}
                   onChange={(value) => handleSelectChange('dueDate', value)} // Use handleSelectChange for consistency
                   options={{ calenderCssClassName: 'custom-calendar-class',calenderLocale: "ne", valueLocale: "en" }} // Optional: Add custom class
                   format="YYYY-MM-DD" // Added format prop (adjust format as needed for BS)
                 />
                 <CalendarIcon className="h-5 w-5 text-gray-500" />
               </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierInvoiceReferenceNo">Supplier Invoice Reference No</Label>
              <Input id="supplierInvoiceReferenceNo" placeholder="Reference" value={formData.supplierInvoiceReferenceNo} onChange={handleInputChange} />
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nepalese Rupee">Nepalese Rupee</SelectItem>
                  {/* Add other currency options as needed */}
                </SelectContent>
              </Select>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="exchangeRateToNPR">Exchange Rate To NPR</Label>
              <Input id="exchangeRateToNPR" type="number" value={formData.exchangeRateToNPR} onChange={handleInputChange} />
            </div>
             <div className="flex items-center space-x-2">
              <input type="checkbox" id="isImport" checked={formData.isImport} onChange={handleInputChange} />
              <Label htmlFor="isImport">Is Import</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
        {mounted ? (
           <>
              <CustomTable className="mb-4">
                <CustomTableHeader>
                  <CustomTableRow className="bg-gray-200">
                    <CustomTableHead>Product / service</CustomTableHead>
                    <CustomTableHead>Qty</CustomTableHead>
                    <CustomTableHead>Rate</CustomTableHead>
                    <CustomTableHead>Discount</CustomTableHead>
                    <CustomTableHead>Tax</CustomTableHead>
                    <CustomTableHead>Amount</CustomTableHead>
                    <CustomTableHead></CustomTableHead>{/* Action column */}
                  </CustomTableRow>

               </CustomTableHeader>
                <CustomTableBody>
                  {formData.items.map((item, index) => (
                    <CustomTableRow key={`item-${index}`} className="border-b last:border-b-0">
                      <CustomTableCell>
                        <Input
                          placeholder="Add Code or Product"
                          value={item.product}
                          onChange={(e) => handleItemInputChange(index, 'product', e.target.value)}
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemInputChange(index, 'qty', e.target.value)}
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemInputChange(index, 'rate', e.target.value)}
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemInputChange(index, 'discount', e.target.value)}
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Input
                          type="number"
                          value={item.tax}
                          onChange={(e) => handleItemInputChange(index, 'tax', e.target.value)}
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Input
                          type="number"
                          value={item.amount}
                          readOnly // Amount is calculated
                        />
                      </CustomTableCell>
                      <CustomTableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </CustomTableCell>
                    </CustomTableRow>
                  ))}
                </CustomTableBody>
              </CustomTable>
            </>
          ) : (
            <div className="py-4 text-center">Loading table...</div>
           )}
           <Button variant="outline" onClick={handleAddItem}>+ Add Additional Cost</Button> 
        </CardContent>
      </Card>
    </div>
  );
}
