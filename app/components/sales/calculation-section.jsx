'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const CalculationSection = ({ formData = {}, setFormData = () => {}, totals = {subtotal:0,totalDiscount:0,totalTax:0,grandTotal:0} }) => {
  const [isExport, setIsExport] = useState(formData.isExport || false);
  const [currency, setCurrency] = useState(formData.currency || 'NPR');
  const [exchangeRate, setExchangeRate] = useState(formData.exchangeRateToNPR || 1);

  // Update form data when local state changes
  useEffect(() => {
    setFormData({
      ...formData,
      isExport,
      currency,
      exchangeRateToNPR: exchangeRate
    });
  }, [isExport, currency, exchangeRate]);

  // Handle currency change
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    
    // If currency is NPR, set exchange rate to 1
    if (newCurrency === 'NPR') {
      setExchangeRate(1);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="isExport"
                checked={isExport}
                onCheckedChange={setIsExport}
              />
              <Label htmlFor="isExport">This is an export sale</Label>
            </div>

            {isExport && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={handleCurrencyChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="NPR">NPR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                
                {currency !== 'NPR' && (
                  <div>
                    <Label htmlFor="exchangeRate">Exchange Rate to NPR</Label>
                    <Input
                      id="exchangeRate"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes here..."
              className="h-32"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currency} {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Discount:</span>
              <span>{currency} {totals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax:</span>
              <span>{currency} {totals.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Grand Total:</span>
              <span>{currency} {totals.grandTotal.toFixed(2)}</span>
            </div>
            {currency !== 'NPR' && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Equivalent in NPR:</span>
                <span>NPR {(totals.grandTotal * exchangeRate).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalculationSection;