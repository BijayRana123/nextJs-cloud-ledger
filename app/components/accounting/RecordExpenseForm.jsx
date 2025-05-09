"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function RecordExpenseForm() {
  const router = useRouter();
  const organizationId = useOrganization();

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

    console.log("Submitting Expense:", dataToSend);

    try {
      const response = await fetch('/api/organization/transactions/record-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Expense recorded and accounting entry created successfully:", result);
        // TODO: Redirect or show success message
        setFormData({
          expenseType: '',
          amount: '',
          paymentMethod: '',
          description: '',
        }); // Clear form
      } else {
        console.error("Error recording expense:", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error recording expense:", error);
      // TODO: Display a generic error message to the user
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
            <Button type="submit" disabled={!organizationId}>Record Expense</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
