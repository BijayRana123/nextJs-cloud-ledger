"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SalesReturnPrintPage() {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/organization/sales-return-vouchers/${id}`)
      .then(res => res.json())
      .then(data => setVoucher(data.salesReturn))
      .catch(() => setError("Failed to fetch sales return voucher"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (voucher) {
      setTimeout(() => window.print(), 300);
    }
  }, [voucher]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!voucher) return <div className="p-4 text-red-600">Sales return voucher not found</div>;

  const { customer, returnNumber, date, referenceNo, currency, items: voucherItems, totalAmount, status } = voucher;
  const items = voucherItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'sans-serif', color: '#222' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Sales Return Voucher</h1>
      <div style={{ marginBottom: 16 }}>
        <div><b>Return Number:</b> {returnNumber || 'N/A'}</div>
        <div><b>Status:</b> {status}</div>
        <div><b>Date:</b> {date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
        <div><b>Reference No:</b> {referenceNo || 'N/A'}</div>
        <div><b>Customer:</b> {typeof customer === 'object' ? customer?.name : customer}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Product</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>Qty</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>Rate</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>Discount</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.productName}</td>
              <td style={{ textAlign: 'right' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{item.discount.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 18 }}>
        Total: {currency || 'NPR'} {totalAmount?.toFixed(2) || '0.00'}
      </div>
    </div>
  );
} 