"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ApproveContraVoucherPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const approveVoucher = async () => {
      try {
        const response = await fetch(`/api/accounting/vouchers/contra/${id}/approve`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
          setTimeout(() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}`), 1500);
        } else {
          console.error(data.message || 'Failed to approve contra voucher');
        }
      } catch (err) {
        console.error('An error occurred while approving contra voucher.', err);
      }
    };
    approveVoucher();
  }, [id, router]);

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Approve Contra Voucher</h1>
      <div className="mt-6">
        <Button variant="secondary" onClick={() => router.push(`/dashboard/accounting/transactions/contra-voucher/${id}`)}>
          Back to Voucher
        </Button>
      </div>
    </div>
  );
} 