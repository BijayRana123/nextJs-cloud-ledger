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

export default function ReceivePaymentForm() {
  const router = useRouter();
  const organizationId = useOrganization();

  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentMethod: '', // e.g., 'Cash', 'Bank'
    salesOrderId: '', // Optional: Link to a specific sales order
    description: '',
  });

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!organizationId) return;
      try {
        const token = getAuthToken();
        console.log('ReceivePaymentForm: Token from cookie:', token ? token.substring(0, 20) + '...' : 'undefined'); // Log the token
        
        const response = await fetch(`/api/organization/customers`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers);
        } else {
          console.error("Failed to fetch customers:", response.status);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
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

    console.log("Submitting Payment Received:", dataToSend);

    try {
      const response = await fetch('/api/organization/transactions/receive-payment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Payment received and accounting entry created successfully:", result);
        // TODO: Redirect or show success message
        setFormData({
          customerId: '',
          amount: '',
          paymentMethod: '',
          salesOrderId: '',
          description: '',
        }); // Clear form
      } else {
        console.error("Error recording payment received:", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error recording payment received:", error);
      // TODO: Display a generic error message to the user
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Record Payment Received</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="customerId">Customer *</Label>
              <Select id="customerId" value={formData.customerId} onValueChange={(value) => handleSelectChange('customerId', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
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
              <Label htmlFor="salesOrderId">Sales Order ID (Optional)</Label>
              {/* TODO: Replace with a sales order select/combobox */}
              <Input id="salesOrderId" value={formData.salesOrderId} onChange={handleInputChange} />
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
