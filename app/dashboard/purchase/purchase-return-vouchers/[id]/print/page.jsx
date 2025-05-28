"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function PurchaseReturnPrintPage() {
  const { id } = useParams();
  const { currentOrganization } = useOrganization();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/organization/purchase-return-vouchers/${id}`)
      .then(res => res.json())
      .then(data => setVoucher(data.purchaseReturn))
      .catch(() => setError("Failed to fetch purchase return voucher"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (voucher) {
      setTimeout(() => window.print(), 300);
    }
  }, [voucher]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!voucher) return <div className="p-4 text-red-600">Purchase return voucher not found</div>;

  const { supplier, referenceNo, date, dueDate, items: voucherItems, totalAmount, status } = voucher;
  const items = voucherItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'N/A',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  // Replace placeholder companyInfo with actual organization info
  const companyInfo = {
    name: currentOrganization?.name || '[Company Name]',
    address: currentOrganization?.address || '[Street Address]',
    city: '', // You can split address if you store city separately
    phone: currentOrganization?.phone || '[000-000-0000]',
    fax: currentOrganization?.fax || '',
    website: currentOrganization?.website || '',
    email: currentOrganization?.email || '',
    taxId: currentOrganization?.taxId || '',
  };
  const billTo = {
    name: typeof supplier === 'object' ? supplier?.name : supplier,
    company: '[Supplier Company]',
    address: '[Supplier Address]',
    city: '',
    phone: '',
  };
  const comments = [
    'Total payment due in 30 days',
    'Please include the return number on your check',
  ];
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  // No tax or S&H for purchase return by default
  const tax = 0;
  const grandTotal = subtotal + tax;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', border: '1px solid #bbb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{companyInfo.name}</div>
          <div>{companyInfo.address}</div>
          <div>{companyInfo.city}</div>
          <div>Phone: {companyInfo.phone}</div>
          {companyInfo.fax && <div>Fax: {companyInfo.fax}</div>}
          {companyInfo.email && <div>Email: {companyInfo.email}</div>}
          {companyInfo.website && <div>Website: {companyInfo.website}</div>}
          {companyInfo.taxId && <div>Tax ID: {companyInfo.taxId}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, color: '#3a5da8', fontWeight: 700, letterSpacing: 2 }}>PURCHASE RETURN</div>
          <table style={{ fontSize: 14, marginTop: 8 }}>
            <tbody>
              <tr><td style={{ paddingRight: 8 }}>DATE</td><td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td></tr>
              <tr><td>RETURN #</td><td>{referenceNo || 'N/A'}</td></tr>
              <tr><td>SUPPLIER</td><td>{billTo.name || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: '45%' }}>
          <div style={{ background: '#223a5e', color: '#fff', padding: '4px 8px', fontWeight: 700, fontSize: 14 }}>BILL FROM:</div>
          <div style={{ border: '1px solid #223a5e', borderTop: 'none', padding: 8 }}>
            <div>{billTo.name}</div>
            <div>{billTo.company}</div>
            <div>{billTo.address}</div>
            <div>{billTo.city}</div>
            <div>{billTo.phone}</div>
          </div>
        </div>
        <div style={{ width: '45%' }}>
          <div style={{ background: '#223a5e', color: '#fff', padding: '4px 8px', fontWeight: 700, fontSize: 14 }}>SHIP TO:</div>
          <div style={{ border: '1px solid #223a5e', borderTop: 'none', padding: 8 }}>
            <div>{companyInfo.name}</div>
            <div>{companyInfo.address}</div>
            <div>{companyInfo.city}</div>
            <div>{companyInfo.phone}</div>
          </div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#223a5e', color: '#fff' }}>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>ITEM #</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>DESCRIPTION</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>QTY</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>UNIT PRICE</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}>{item.productCode}</td>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}>{item.productName}</td>
              <td style={{ border: '1px solid #223a5e', padding: 6, textAlign: 'right' }}>{item.qty}</td>
              <td style={{ border: '1px solid #223a5e', padding: 6, textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
              <td style={{ border: '1px solid #223a5e', padding: 6, textAlign: 'right' }}>{(item.qty * item.rate).toFixed(2)}</td>
            </tr>
          ))}
          {/* Empty rows for visual spacing */}
          {Array.from({ length: Math.max(8 - items.length, 0) }).map((_, idx) => (
            <tr key={items.length + idx}>
              <td style={{ border: '1px solid #223a5e', padding: 6, height: 24 }}></td>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}></td>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}></td>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}></td>
              <td style={{ border: '1px solid #223a5e', padding: 6 }}></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', marginTop: 0 }}>
        <div style={{ width: '60%', marginTop: 16 }}>
          <div style={{ background: '#f3f3f3', border: '1px solid #bbb', padding: 8, fontSize: 13, minHeight: 80 }}>
            <b>Other Comments or Special Instructions</b>
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              {comments.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
        <div style={{ width: '40%', marginTop: 16 }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              <tr><td style={{ padding: '4px 0' }}>SUBTOTAL</td><td style={{ textAlign: 'right' }}>{subtotal.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>TAX</td><td style={{ textAlign: 'right' }}>{tax.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '4px 0' }}>S & H</td><td style={{ textAlign: 'right' }}>-</td></tr>
              <tr><td style={{ padding: '4px 0' }}>OTHER</td><td style={{ textAlign: 'right' }}>-</td></tr>
              <tr style={{ fontWeight: 700, fontSize: 16 }}>
                <td style={{ padding: '8px 0' }}>TOTAL</td>
                <td style={{ textAlign: 'right', color: '#3a5da8', fontSize: 18 }}>{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 14 }}>
        <b>Make all checks payable to</b> <span style={{ fontWeight: 700 }}>{companyInfo.name}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: '#3a5da8', fontWeight: 700 }}>
        Thank You For Your Business!
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: '#888' }}>
        If you have any questions about this return, please contact<br />
        [Name, Phone #, E-mail]
      </div>
      <div style={{ marginTop: 24, fontSize: 10, color: '#bbb', textAlign: 'right' }}>
        © 2011-2024 Vertex42.com (template inspired)
      </div>
    </div>
  );
} 