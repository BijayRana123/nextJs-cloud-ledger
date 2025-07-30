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

export default function RecordOtherIncomeForm() {
  const router = useRouter();
  const organizationId = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    incomeType: '', // e.g., 'Interest Income', 'Rental Income'
    amount: '',
    receiptMethod: '', // e.g., 'Cash', 'Bank'
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



    try {
      // Use the organization API which already handles the accounting entries
      const orgResponse = await fetch('/api/organization/transactions/record-other-income', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const orgResult = await orgResponse.json();

      if (!orgResponse.ok) {
        throw new Error(orgResult.message || "Failed to record income in organization");
      }

      // Success
      toast({
        title: "Income Recorded",
        description: "Your income has been successfully recorded with accounting entries.",
      });

      // Clear form
      setFormData({
        incomeType: '',
        amount: '',
        receiptMethod: '',
        description: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/accounting/journal-entries");
      }, 1500);
    } catch (error) {
      console.error("Error recording other income:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record income. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Record Other Income</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="incomeType">Income Type *</Label>
              <Select id="incomeType" value={formData.incomeType} onValueChange={(value) => handleSelectChange('incomeType', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select income type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interest Income">Interest Income</SelectItem>
                  <SelectItem value="Rental Income">Rental Income</SelectItem>
                  <SelectItem value="Royalty Income">Royalty Income</SelectItem>
                  <SelectItem value="Commission Income">Commission Income</SelectItem>
                  <SelectItem value="Other Income">Other Income</SelectItem>
                  {/* Add other income types as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="receiptMethod">Receipt Method *</Label>
              <Select id="receiptMethod" value={formData.receiptMethod} onValueChange={(value) => handleSelectChange('receiptMethod', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select receipt method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  {/* Add other payment methods as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" value={formData.description} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting || !organizationId}>
              {isSubmitting ? "Recording..." : "Record Income"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
