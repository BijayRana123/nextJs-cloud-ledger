"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConditionalDatePicker } from "@/components/ConditionalDatePicker";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useCalendar } from "@/lib/context/CalendarContext";
import AccountAutocompleteInput from "@/components/accounting/AccountAutocompleteInput";
import { accounts } from "@/lib/accountingClient";

export default function AddContraVoucherPage() {
  const router = useRouter();
  const { isNepaliCalendar } = useCalendar();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromAccount: "",
    toAccount: "",
    amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [voucher, setVoucher] = useState(null);

  // Build account options from accounts object
  const accountOptions = [
    ...accounts.assets.map(a => `assets:${a}`),
    ...accounts.liabilities.map(a => `liabilities:${a}`),
    ...accounts.income.map(a => `income:${a}`),
    ...accounts.expenses.map(a => `expenses:${a}`),
    ...accounts.equity.map(a => `equity:${a}`),
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/accounting/vouchers/contra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create contra voucher");
      setVoucher(data.contraVoucher);
      setSuccess(true);
      toast({ title: "Contra voucher created!", description: "You can now approve it if needed." });
      setTimeout(() => router.push(`/dashboard/accounting/transactions/contra-voucher/${data.contraVoucher._id}`), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Contra Voucher</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/accounting/transactions/contra-voucher")}>Back to Contra Vouchers</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contra Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {success && voucher && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Contra voucher created!
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="flex items-center gap-2">
                  <ConditionalDatePicker
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromAccount">From Account</Label>
                <AccountAutocompleteInput
                  accountOptions={accountOptions}
                  value={formData.fromAccount}
                  onChange={val => setFormData(prev => ({ ...prev, fromAccount: val }))}
                  placeholder="Select or type account"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAccount">To Account</Label>
                <AccountAutocompleteInput
                  accountOptions={accountOptions}
                  value={formData.toAccount}
                  onChange={val => setFormData(prev => ({ ...prev, toAccount: val }))}
                  placeholder="Select or type account"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" type="text" value={formData.notes} onChange={handleChange} />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Voucher"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 