"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContraVoucherPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromAccount: "",
    toAccount: "",
    amount: "",
    currency: "NPR",
    exchangeRateToNPR: 1,
    notes: "",
    status: "DRAFT"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [voucher, setVoucher] = useState(null);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!voucher?._id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/vouchers/contra/${voucher._id}/approve`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve contra voucher");
      setVoucher(data.contraVoucher);
      toast({ title: "Contra voucher approved!" });
      setTimeout(() => router.push("/dashboard/accounting/journal-entries"), 1500);
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
        <Button variant="outline" onClick={() => router.push("/dashboard/accounting/journal-entries")}>Back to Journal Entries</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contra Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {success && voucher && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Contra voucher created! Status: <b>{voucher.status}</b>
              {voucher.status === "DRAFT" && (
                <Button className="ml-4" onClick={handleApprove} disabled={loading}>Approve</Button>
              )}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConditionalDatePicker id="date" name="date" label="Voucher Date" value={formData.date} onChange={handleChange} required />
              <div className="space-y-2">
                <Label htmlFor="fromAccount">From Account</Label>
                <Select id="fromAccount" name="fromAccount" value={formData.fromAccount} onValueChange={(value) => handleSelectChange("fromAccount", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assets:Cash">Cash</SelectItem>
                    <SelectItem value="Assets:Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAccount">To Account</Label>
                <Select id="toAccount" name="toAccount" value={formData.toAccount} onValueChange={(value) => handleSelectChange("toAccount", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assets:Cash">Cash</SelectItem>
                    <SelectItem value="Assets:Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" type="text" value={formData.currency} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeRateToNPR">Exchange Rate to NPR</Label>
                <Input id="exchangeRateToNPR" name="exchangeRateToNPR" type="number" step="0.0001" value={formData.exchangeRateToNPR} onChange={handleChange} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" type="text" value={formData.notes} onChange={handleChange} />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save as Draft"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 