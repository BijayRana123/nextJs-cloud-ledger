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

export default function PaySupplierForm({ onSuccess, voucherNumber, initialData, onSubmit, mode }) {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for dynamic data
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    supplierId: initialData?.supplierId || '',
    paymentVoucherNumber: initialData?.paymentVoucherNumber || '',
    amount: initialData?.amount || '',
    paymentMethod: initialData?.paymentMethod || '',
    notes: initialData?.notes || '',
  });

  // Fetch suppliers on component mount
  useEffect(() => {
    if (organizationId) {
      fetchSuppliers();
    }
  }, [organizationId]);

  // Sync voucher number from prop
  useEffect(() => {
    setFormData(prev => ({ ...prev, paymentVoucherNumber: voucherNumber || '' }));
  }, [voucherNumber]);

  // Sync initialData if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        supplierId: initialData.supplierId || '',
        paymentVoucherNumber: initialData.paymentVoucherNumber || '',
        amount: initialData.amount || '',
        paymentMethod: initialData.paymentMethod || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default create logic
        const response = await fetch('/api/organization/payment-vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to create payment voucher');
        }
        const result = await response.json();
        if (onSuccess) onSuccess();
        // Redirect to the payment voucher detail page
        if (result && result._id) {
          router.push(`/dashboard/accounting/transactions/pay-supplier/${result._id}`);
        } else if (result && result.paymentVoucher && result.paymentVoucher._id) {
          router.push(`/dashboard/accounting/transactions/pay-supplier/${result.paymentVoucher._id}`);
        } else {
          router.push('/dashboard/accounting/transactions/pay-supplier');
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
              <Label>Payment Voucher Number</Label>
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
