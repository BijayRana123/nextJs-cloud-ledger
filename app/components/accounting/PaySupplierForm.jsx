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

export default function PaySupplierForm({ onSuccess }) {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for dynamic data
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(true);
  const [nextBillNumber, setNextBillNumber] = useState('');

  const [formData, setFormData] = useState({
    supplierId: '',
    billNumber: '',
    amount: '',
    paymentMethod: '',
    notes: '',
  });

  // Fetch suppliers and next bill number on component mount
  useEffect(() => {
    if (organizationId) {
      fetchSuppliers();
      fetchNextBillNumber();
    }
  }, [organizationId]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization/suppliers?organizationId=${organizationId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuppliers(data.suppliers || []);
      } else {
        console.error("Failed to fetch suppliers:", data.message);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextBillNumber = async () => {
    try {
      const response = await fetch('/api/accounting/counters/next?type=bill', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setNextBillNumber(data.nextNumber);
      } else {
        console.error("Failed to fetch next bill number");
        setNextBillNumber('BILL-2001'); // Fallback
      }
    } catch (error) {
      console.error("Error fetching next bill number:", error);
      setNextBillNumber('BILL-2001'); // Fallback
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
    
    // If changing supplier, update the selected supplier
    if (id === 'supplierId') {
      setSelectedSupplier(value);
      if (value) {
        // Set the bill number when a supplier is selected
        setFormData(prev => ({
          ...prev,
          billNumber: nextBillNumber,
        }));
      } else {
        // Reset fields when supplier is deselected
        setFormData(prev => ({
          ...prev,
          billNumber: '',
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
      const orgResponse = await fetch('/api/organization/transactions/pay-supplier', {
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
        title: "Payment Sent",
        description: "Payment has been successfully recorded with accounting entries.",
      });

      // Clear form and fetch next bill number for future use
      setFormData({
        supplierId: '',
        billNumber: '',
        amount: '',
        paymentMethod: '',
        notes: '',
      });
      setSelectedSupplier('');
      fetchNextBillNumber();
      
      // Call onSuccess if provided, otherwise redirect to journal-entries
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/dashboard/accounting/journal-entries");
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
        <h2 className="text-xl font-semibold mb-4">Pay Supplier</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select id="supplierId" value={formData.supplierId} onValueChange={(value) => handleSelectChange('supplierId', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input 
                id="billNumber" 
                value={formData.billNumber} 
                placeholder="Auto-generated when supplier selected"
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
