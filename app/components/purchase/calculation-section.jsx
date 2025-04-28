"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Assuming Input might be used for discount percentage

export default function CalculationSection({ items }) {
  // Calculate Sub Total
  const subTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (qty * rate);
  }, 0);

  // Assuming discount is applied to the subtotal
  const totalDiscount = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const itemSubtotal = qty * rate;
    return sum + (itemSubtotal * (discount / 100));
  }, 0);


  const nonTaxableTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0;
     // Assuming 'NO_VAT' or similar indicates non-taxable
    if (item.tax === 'NO_VAT' || tax === 0) {
       const itemSubtotal = qty * rate;
       const discountedAmount = itemSubtotal * (1 - discount / 100);
       return sum + discountedAmount;
    }
    return sum;
  }, 0);

   const taxableTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0;
     // Assuming items with tax > 0 are taxable
    if (item.tax !== 'NO_VAT' && tax > 0) {
       const itemSubtotal = qty * rate;
       const discountedAmount = itemSubtotal * (1 - discount / 100);
       return sum + discountedAmount;
    }
    return sum;
  }, 0);


  // Calculate total VAT
  const totalVAT = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0;
    if (item.tax !== 'NO_VAT' && tax > 0) {
       const itemSubtotal = qty * rate;
       const discountedAmount = itemSubtotal * (1 - discount / 100);
       return sum + (discountedAmount * (tax / 100));
    }
    return sum;
  }, 0);


  // Calculate Grand Total
  const grandTotal = subTotal - totalDiscount + totalVAT;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculation</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between">
          <Label>Sub Total</Label>
          <span>{subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label>Discount</Label>
           {/* Assuming a global discount input might be here, or just display total discount */}
           {/* For now, just displaying the calculated total discount */}
          <span>{totalDiscount.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
          <Label>Non-Taxable Total</Label>
          <span>{nonTaxableTotal.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
          <Label>Taxable Total</Label>
          <span>{taxableTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <Label>VAT</Label>
          <span>{totalVAT.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <Label>Grand Total</Label>
          <span>{grandTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
