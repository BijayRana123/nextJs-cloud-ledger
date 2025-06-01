"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";

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
      .then(data => setVoucher(data.salesReturnVoucher))
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

  const { customer, referenceNo: salesReturnNumber, date, dueDate, currency, items: voucherItems, totalAmount, status } = voucher;
  const items = voucherItems?.map(item => ({
    productName: item.item?.name || 'Unknown Product',
    productCode: item.item?._id || 'N/A',
    qty: item.quantity || 0,
    rate: item.price || 0,
    discount: item.discount || 0,
    amount: (item.quantity || 0) * (item.price || 0)
  })) || [];

  // Placeholder company and invoice info
  const companyInfo = {
    name: '[Company Name]',
    address: '[Street Address]',
    city: '[City, ST ZIP]',
    phone: '[000-000-0000]',
    fax: '[000-000-0000]',
    website: '',
  };
  const billTo = {
    name: '[Name]',
    company: '[Company Name]',
    address: '[Street Address]',
    city: '[City, ST ZIP]',
    phone: '[Phone]'
  };
  const shipTo = billTo;
  const comments = [
    'Please reference this return on your correspondence',
    'Contact us if you have any questions about this return',
  ];
  const taxRate = 6.75;
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const tax = subtotal * (taxRate / 100);
  const grandTotal = subtotal + tax;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', border: '1px solid #bbb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{companyInfo.name}</div>
          <div>{companyInfo.address}</div>
          <div>{companyInfo.city}</div>
          <div>Phone: {companyInfo.phone}</div>
          <div>Fax: {companyInfo.fax}</div>
          {companyInfo.website && <div>Website: {companyInfo.website}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, color: '#3a5da8', fontWeight: 700, letterSpacing: 2 }}>SALES RETURN INVOICE</div>
          <table style={{ fontSize: 14, marginTop: 8 }}>
            <tbody>
              <tr><td style={{ paddingRight: 8 }}>DATE</td><td>{date ? new Date(date).toLocaleDateString() : 'N/A'}</td></tr>
              <tr><td>RETURN #</td><td>{salesReturnNumber || 'N/A'}</td></tr>
              <tr><td>CUSTOMER ID</td><td>{customer?._id || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: '45%' }}>
          <div style={{ background: '#223a5e', color: '#fff', padding: '4px 8px', fontWeight: 700, fontSize: 14 }}>BILL TO:</div>
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
            <div>{shipTo.name}</div>
            <div>{shipTo.company}</div>
            <div>{shipTo.address}</div>
            <div>{shipTo.city}</div>
            <div>{shipTo.phone}</div>
          </div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0, fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#223a5e', color: '#fff' }}>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>SALESPERSON</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>P.O. #</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>DUE DATE</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>SHIP VIA</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>F.O.B.</th>
            <th style={{ padding: 6, border: '1px solid #223a5e' }}>TERMS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #223a5e', height: 28 }}></td>
            <td style={{ border: '1px solid #223a5e' }}></td>
            <td style={{ border: '1px solid #223a5e' }}>{dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</td>
            <td style={{ border: '1px solid #223a5e' }}></td>
            <td style={{ border: '1px solid #223a5e' }}></td>
            <td style={{ border: '1px solid #223a5e' }}></td>
          </tr>
        </tbody>
      </table>
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
              <tr><td style={{ padding: '4px 0' }}>TAX RATE</td><td style={{ textAlign: 'right' }}>{taxRate.toFixed(3)}%</td></tr>
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