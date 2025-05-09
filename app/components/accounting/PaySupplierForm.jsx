"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';
import { getAuthToken, getAuthHeaders } from '@/lib/utils/auth-helpers';

export default function PaySupplierForm() {
  const router = useRouter();
  const organizationId = useOrganization();

  const [formData, setFormData] = useState({
    supplierId: '',
    amount: '',
    paymentMethod: '', // e.g., 'Cash', 'Bank'
    purchaseOrderId: '', // Optional: Link to a specific purchase order
    description: '',
  });

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!organizationId) return;
      try {
        const token = getAuthToken();
        console.log('PaySupplierForm: Token from cookie:', token ? token.substring(0, 20) + '...' : 'undefined'); // Log the token
        
        const response = await fetch(`/api/organization/suppliers`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setSuppliers(data.suppliers);
        } else {
          console.error("Failed to fetch suppliers:", response.status);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, [organizationId]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
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

    const dataToSend = {
      ...formData,
      organizationId: organizationId, // Include organizationId in the data
      amount: parseFloat(formData.amount) || 0, // Ensure amount is a number
    };

    console.log("Submitting Payment Sent:", dataToSend);

    try {
      const response = await fetch('/api/organization/transactions/pay-supplier', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Payment sent and accounting entry created successfully:", result);
        // TODO: Redirect or show success message
        setFormData({
          supplierId: '',
          amount: '',
          paymentMethod: '',
          purchaseOrderId: '',
          description: '',
        }); // Clear form
      } else {
        console.error("Error recording payment sent:", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error recording payment sent:", error);
      // TODO: Display a generic error message to the user
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Record Payment Sent to Supplier</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select id="supplierId" value={formData.supplierId} onValueChange={(value) => handleSelectChange('supplierId', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select id="paymentMethod" value={formData.paymentMethod} onValueChange={(value) => handleSelectChange('paymentMethod', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  {/* Add other payment methods as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="purchaseOrderId">Purchase Order ID (Optional)</Label>
              {/* TODO: Replace with a purchase order select/combobox */}
              <Input id="purchaseOrderId" value={formData.purchaseOrderId} onChange={handleInputChange} />
            </div>
             <div className="flex flex-col space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formData.description} onChange={handleInputChange} />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={!organizationId}>Record Payment</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
