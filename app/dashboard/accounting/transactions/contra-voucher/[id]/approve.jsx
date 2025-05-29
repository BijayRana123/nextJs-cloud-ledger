"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ApproveContraVoucherPage() {
  const { id } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    const approveVoucher = async () => {
      setStatus('pending');
      setMessage('Approving voucher...');
      try {
        const response = await fetch(`/api/accounting/vouchers/contra/${id}/approve`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage('Contra voucher approved! Redirecting...');
          setTimeout(() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}`), 1500);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to approve contra voucher');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while approving contra voucher.');
      }
    };
    approveVoucher();
  }, [id, router]);

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Approve Contra Voucher</h1>
      <div className={
        status === 'success' ? 'text-green-700 bg-green-100 border border-green-400 px-4 py-3 rounded' :
        status === 'error' ? 'text-red-700 bg-red-100 border border-red-400 px-4 py-3 rounded' :
        'text-gray-700 bg-gray-100 border border-gray-300 px-4 py-3 rounded'
      }>
        {message}
      </div>
      <div className="mt-6">
        <Button variant="secondary" onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}`)}>
          Back to Voucher
        </Button>
      </div>
    </div>
  );
} 