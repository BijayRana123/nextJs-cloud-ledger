"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCookie } from '@/lib/utils';

export default function SalesOrderPrintPage() {
  const { id } = useParams();
  const [salesOrder, setSalesOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
        const response = await fetch(`/api/organization/sales-vouchers/${id}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch sales order');
        const data = await response.json();
        setSalesOrder(data.salesOrder);
      } catch (err) {
        setError('Failed to fetch sales order');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesOrder();
  }, [id]);

  useEffect(() => {
    if (salesOrder) {
      setTimeout(() => window.print(), 300);
    }
  }, [salesOrder]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!salesOrder) return <div className="p-4 text-red-600">Sales order not found</div>;

  const {
    customer,
    salesOrderNumber,
    date,
    dueDate,
    referenceNo,
    billNumber,
    customerInvoiceReferenceNo,
    currency,
    exchangeRateToNPR,
    isExport,
    items: salesItems,
    totalAmount,
    notes
  } = salesOrder;

  const items = salesItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'No Code',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    tax: item.tax || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  const customerName = typeof customer === 'object' ? customer.name : customer;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', border: '1px solid #bbb' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Sales Order</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Customer Information</div>
          <div>Name: {customerName || 'N/A'}</div>
          <div>Address: {customer?.address || 'N/A'}</div>
          <div>PAN: {customer?.pan || 'N/A'}</div>
          <div>Phone: {customer?.phoneNumber || 'N/A'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Order No: {salesOrderNumber || 'N/A'}</div>
          <div>Date: {date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
          <div>Due Date: {dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</div>
          <div>Reference No: {referenceNo || 'N/A'}</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: 8, border: '1px solid #bbb' }}>Product</th>
            <th style={{ padding: 8, border: '1px solid #bbb' }}>Quantity</th>
            <th style={{ padding: 8, border: '1px solid #bbb' }}>Rate</th>
            <th style={{ padding: 8, border: '1px solid #bbb' }}>Discount</th>
            <th style={{ padding: 8, border: '1px solid #bbb' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8, border: '1px solid #bbb' }}>{item.productName}</td>
                <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'right' }}>{item.qty}</td>
                <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'right' }}>{item.discount.toFixed(2)}</td>
                <td style={{ padding: 8, border: '1px solid #bbb', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>No items found</td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <table style={{ minWidth: 300 }}>
          <tbody>
            <tr>
              <td style={{ padding: 4, color: '#555' }}>Subtotal:</td>
              <td style={{ padding: 4, textAlign: 'right' }}>NPR {items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, color: '#555' }}>Total Discount:</td>
              <td style={{ padding: 4, textAlign: 'right' }}>NPR {items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: 4, color: '#555' }}>Total Tax:</td>
              <td style={{ padding: 4, textAlign: 'right' }}>NPR {items.reduce((sum, item) => sum + item.tax, 0).toFixed(2)}</td>
            </tr>
            <tr style={{ fontWeight: 700 }}>
              <td style={{ padding: 4 }}>Grand Total:</td>
              <td style={{ padding: 4, textAlign: 'right' }}>NPR {totalAmount?.toFixed(2) || '0.00'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {notes && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Notes</div>
          <div>{notes}</div>
        </div>
      )}
    </div>
  );
} 