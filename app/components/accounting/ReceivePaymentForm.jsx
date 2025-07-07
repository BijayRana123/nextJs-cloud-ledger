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

export default function ReceivePaymentForm({ onSuccess, voucherNumber, setVoucherNumber }) {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for dynamic data
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    receiptVoucherNumber: voucherNumber || '',
    amount: '',
    paymentMethod: '',
    notes: '',
  });

  // Sync voucher number from prop
  useEffect(() => {
    setFormData(prev => ({ ...prev, receiptVoucherNumber: voucherNumber || '' }));
  }, [voucherNumber]);

  // Fetch customers on component mount
  useEffect(() => {
    if (organizationId) {
      fetchCustomers();
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
      // Use the new receipt voucher API which already handles the accounting entries
      const orgResponse = await fetch('/api/organization/receipt-vouchers', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          amount: parseFloat(formData.amount) || 0,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        }),
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

      // Redirect to the new receipt voucher detail page if ID is available
      if (orgResult && orgResult.receiptVoucher && orgResult.receiptVoucher._id) {
        router.push(`/dashboard/accounting/transactions/receive-payment/${orgResult.receiptVoucher._id}`);
      } else if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/dashboard/accounting/transactions/receive-payment");
        }, 1500);
      }
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
              <Label>Receipt Voucher Number</Label>
              <div className="text-gray-500 text-sm">Voucher number will be generated after saving.</div>
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
