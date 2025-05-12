"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders } from '@/lib/utils/auth-helpers';

export default function ReceivePaymentForm() {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for dynamic data
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    amount: '',
    paymentMethod: '',
    notes: '',
  });

  // Fetch customers and next invoice number on component mount
  useEffect(() => {
    if (organizationId) {
      fetchCustomers();
      fetchNextInvoiceNumber();
    }
  }, [organizationId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/customers?organizationId=${organizationId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers || []);
      } else {
        console.error("Failed to fetch customers:", data.message);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch('/api/accounting/counters/next?type=invoice', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setNextInvoiceNumber(data.nextNumber);
      } else {
        console.error("Failed to fetch next invoice number");
        setNextInvoiceNumber('INV-1001'); // Fallback
      }
    } catch (error) {
      console.error("Error fetching next invoice number:", error);
      setNextInvoiceNumber('INV-1001'); // Fallback
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
    
    // If changing customer, update the selected customer
    if (id === 'customerId') {
      setSelectedCustomer(value);
      if (value) {
        // Set the invoice number when a customer is selected
        setFormData(prev => ({
          ...prev,
          invoiceNumber: nextInvoiceNumber,
        }));
      } else {
        // Reset fields when customer is deselected
        setFormData(prev => ({
          ...prev,
          invoiceNumber: '',
          amount: '',
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization ID is required. Please refresh and try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const dataToSend = {
      ...formData,
      organizationId,
      amount: parseFloat(formData.amount) || 0,
    };

    try {
      // Use the organization API which already handles the accounting entries
      const orgResponse = await fetch('/api/organization/transactions/receive-payment', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const orgResult = await orgResponse.json();

      if (!orgResponse.ok) {
        throw new Error(orgResult.message || "Failed to record payment in organization");
      }

      // Success
      toast({
        title: "Payment Received",
        description: "Payment has been successfully recorded with accounting entries.",
      });

      // Clear form and fetch next invoice number for future use
      setFormData({
        customerId: '',
        invoiceNumber: '',
        amount: '',
        paymentMethod: '',
        notes: '',
      });
      setSelectedCustomer('');
      fetchNextInvoiceNumber();
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/accounting/journal-entries");
      }, 1500);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Receive Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="customerId">Customer *</Label>
              <Select id="customerId" value={formData.customerId} onValueChange={(value) => handleSelectChange('customerId', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input 
                id="invoiceNumber" 
                value={formData.invoiceNumber} 
                placeholder="Auto-generated when customer selected"
                disabled={true}
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">System-generated, unique identifier</p>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} required />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select id="paymentMethod" value={formData.paymentMethod} onValueChange={(value) => handleSelectChange('paymentMethod', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="CreditCard">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={handleInputChange} placeholder="Optional payment notes" />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting || !organizationId || loading}>
              {isSubmitting ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
