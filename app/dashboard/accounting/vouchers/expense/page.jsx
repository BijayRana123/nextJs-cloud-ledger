"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConditionalDatePicker } from "@/components/ConditionalDatePicker";

export default function ExpenseVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    expenseType: "",
    paymentMethod: "Cash",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  });

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Form validation
      if (!formData.expenseType) {
        throw new Error("Expense type is required");
      }
      if (!formData.paymentMethod) {
        throw new Error("Payment method is required");
      }
      if (!formData.amount || Number(formData.amount) <= 0) {
        throw new Error("Amount must be a positive number");
      }
      if (!formData.description) {
        throw new Error("Description is required");
      }
      if (!formData.date) {
        throw new Error("Date is required");
      }

      // Submit the expense voucher
      const response = await fetch("/api/accounting/vouchers/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create expense voucher");
      }

      // Success - reset form and show success message
      setFormData({
        expenseType: "",
        paymentMethod: "Cash",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/accounting/journal-entries");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Expense Voucher</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting/journal-entries")}
        >
          Back to Journal Entries
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Expense voucher created successfully! Redirecting...
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="expenseType">Expense Type</Label>
                <Select 
                  value={formData.expenseType} 
                  onValueChange={(value) => handleSelectChange("expenseType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent Expense">Rent Expense</SelectItem>
                    <SelectItem value="Utilities Expense">Utilities Expense</SelectItem>
                    <SelectItem value="Salaries Expense">Salaries Expense</SelectItem>
                    <SelectItem value="Office Supplies Expense">Office Supplies Expense</SelectItem>
                    <SelectItem value="Travel Expense">Travel Expense</SelectItem>
                    <SelectItem value="Cost of Goods Sold">Cost of Goods Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ConditionalDatePicker
                id="date"
                name="date"
                label="Voucher Date"
                value={formData.date}
                onChange={handleChange}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Credit">Credit (Accounts Payable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter expense description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Expense Voucher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
