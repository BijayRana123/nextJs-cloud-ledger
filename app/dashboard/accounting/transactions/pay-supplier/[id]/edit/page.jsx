"use client";

import { useState, useEffect } from "react";
import PaySupplierForm from '@/app/components/accounting/PaySupplierForm';
import { useParams, useRouter } from 'next/navigation';

export default function EditPaymentVoucherPage() {
  const { id } = useParams();
  const router = useRouter();
  const [voucherData, setVoucherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/organization/payment-vouchers/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment voucher');
        }
        const data = await response.json();
        setVoucherData(data.paymentVoucher);
      } catch (err) {
        setError("Failed to load payment voucher");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVoucher();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      const response = await fetch(`/api/organization/payment-vouchers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update payment voucher');
      }
      router.push(`/dashboard/accounting/transactions/pay-supplier/${id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!voucherData) return <div className="p-4 text-red-600">Payment voucher not found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Payment Voucher</h1>
      <PaySupplierForm
        initialData={voucherData}
        onSubmit={handleUpdate}
        mode="edit"
      />
    </div>
  );
} 