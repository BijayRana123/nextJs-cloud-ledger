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
import { getAuthHeaders } from '@/lib/utils/auth-helpers';

export default function RecordExpenseForm() {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    expenseType: '', // e.g., 'Rent Expense', 'Utilities Expense'
    amount: '',
    paymentMethod: '', // e.g., 'Cash', 'Bank', 'Credit' (for Accounts Payable)
    description: '',
  });

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
    setIsSubmitting(true);

    if (!organizationId) {
      console.error("Organization ID is not available from context. Cannot submit.");
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
      organizationId: organizationId, // Include organizationId in the data
      amount: parseFloat(formData.amount) || 0, // Ensure amount is a number
    };

    console.log("Submitting Expense:", dataToSend);

    try {
      // Use the organization API which already handles the accounting entries
      const orgResponse = await fetch('/api/organization/transactions/record-expense', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const orgResult = await orgResponse.json();

      if (!orgResponse.ok) {
        throw new Error(orgResult.message || "Failed to record expense in organization");
      }

      // Success
      toast({
        title: "Expense Recorded",
        description: "Your expense has been successfully recorded with accounting entries.",
      });

      // Clear form
      setFormData({
        expenseType: '',
        amount: '',
        paymentMethod: '',
        description: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/accounting/journal-entries");
      }, 1500);
    } catch (error) {
      console.error("Error recording expense:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Record Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="expenseType">Expense Type *</Label>
               <Select id="expenseType" value={formData.expenseType} onValueChange={(value) => handleSelectChange('expenseType', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {/* Populate with actual expense types from your chart of accounts */}
                  <SelectItem value="Rent Expense">Rent Expense</SelectItem>
                  <SelectItem value="Utilities Expense">Utilities Expense</SelectItem>
                  <SelectItem value="Salaries Expense">Salaries Expense</SelectItem>
                   <SelectItem value="Office Supplies Expense">Office Supplies Expense</SelectItem>
                    <SelectItem value="Travel Expense">Travel Expense</SelectItem>
                  {/* Add other expense types as needed */}
                </SelectContent>
              </Select>
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
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Credit">Credit (Accounts Payable)</SelectItem>
                  {/* Add other payment methods as needed */}
                </SelectContent>
              </Select>
            </div>
             <div className="flex flex-col space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" value={formData.description} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting || !organizationId}>
              {isSubmitting ? "Recording..." : "Record Expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
