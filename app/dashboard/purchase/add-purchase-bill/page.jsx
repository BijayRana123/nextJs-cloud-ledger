"use client";

import { useState, useEffect } from 'react'; // Import useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomTable, CustomTableHeader, CustomTableBody, CustomTableRow, CustomTableHead, CustomTableCell } from "@/components/ui/CustomTable"; // Import custom table components
import { CalendarIcon, XIcon, SearchIcon } from "lucide-react"; // Icons

export default function AddPurchaseBillPage() {
  const [isClient, setIsClient] = useState(false); // State to track if component is mounted on client

  useEffect(() => {
    setIsClient(true); // Set to true after component mounts on client
  }, []);

  const [formData, setFormData] = useState({
    supplierName: '',
    referenceNo: '',
    billNumber: '',
    billDate: '',
    dueDate: '',
    supplierInvoiceReferenceNo: '',
    currency: 'Nepalese Rupee', // Default currency
    exchangeRateToNPR: '1', // Default exchange rate
    isImport: false,
    items: [], // Array to hold product/service items
  });

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

  // Only render the component content on the client side after mounting
  if (!isClient) {
    return null; // Or a loading spinner
  }

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
              <Input id="supplierName" placeholder="Supplier Name" value={formData.supplierName} onChange={handleInputChange} required />
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
              <Label htmlFor="billDate">Bill Date *</Label>
               <div className="flex items-center gap-2">
                 <Input id="billDate" type="date" value={formData.billDate} onChange={handleInputChange} required />
                 <CalendarIcon className="h-5 w-5 text-gray-500" />
               </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dueDate">Due Date *</Label>
               <div className="flex items-center gap-2">
                 <Input id="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} required />
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
          {isClient && (
            <CustomTable className="mb-4"> {/* Use CustomTable */}
              <CustomTableHeader><CustomTableRow className="bg-gray-200"><CustomTableHead>Product / service</CustomTableHead><CustomTableHead>Qty</CustomTableHead><CustomTableHead>Rate</CustomTableHead><CustomTableHead>Discount</CustomTableHead><CustomTableHead>Tax</CustomTableHead><CustomTableHead>Amount</CustomTableHead><CustomTableHead></CustomTableHead>{/* Action column */}</CustomTableRow></CustomTableHeader>
              <CustomTableBody>
                {formData.items.map((item, index) => (
                  <CustomTableRow key={index} className="border-b last:border-b-0"><CustomTableCell>
                      <Input
                        placeholder="Add Code or Product"
                        value={item.product}
                        onChange={(e) => handleItemInputChange(index, 'product', e.target.value)}
                      />
                    </CustomTableCell><CustomTableCell>
                       <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemInputChange(index, 'qty', e.target.value)}
                      />
                    </CustomTableCell><CustomTableCell>
                       <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemInputChange(index, 'rate', e.target.value)}
                      />
                    </CustomTableCell><CustomTableCell>
                       <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemInputChange(index, 'discount', e.target.value)}
                      />
                    </CustomTableCell><CustomTableCell>
                       <Input
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleItemInputChange(index, 'tax', e.target.value)}
                      />
                    </CustomTableCell><CustomTableCell>
                       <Input
                        type="number"
                        value={item.amount}
                        readOnly // Amount is calculated
                      />
                    </CustomTableCell><CustomTableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </CustomTableCell>
                  </CustomTableRow>
                ))}
              </CustomTableBody>
            </CustomTable>
          )}
          <Button variant="outline" onClick={handleAddItem}>+ Add Additional Cost</Button> {/* Assuming this button adds items */}
        </CardContent>
      </Card>
    </div>
  );
}
