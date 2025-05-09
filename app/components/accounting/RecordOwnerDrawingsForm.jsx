"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function RecordOwnerDrawingsForm() {
  const router = useRouter();
  const organizationId = useOrganization();

  const [formData, setFormData] = useState({
    amount: '',
    method: '', // e.g., 'Cash', 'Bank'
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

    console.log("Submitting Owner Drawings:", dataToSend);

    try {
      const response = await fetch('/api/organization/transactions/record-owner-drawings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Owner drawings recorded and accounting entry created successfully:", result);
        // TODO: Redirect or show success message
        setFormData({
          amount: '',
          method: '',
        }); // Clear form
      } else {
        console.error("Error recording owner drawings:", result.message);
        // TODO: Display an error message to the user
      }
    } catch (error) {
      console.error("Error recording owner drawings:", error);
      // TODO: Display a generic error message to the user
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Record Owner Drawings</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" value={formData.amount} onChange={handleInputChange} required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="method">Drawing Method *</Label>
              <Select id="method" value={formData.method} onValueChange={(value) => handleSelectChange('method', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  {/* Add other methods as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={!organizationId}>Record Drawings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
