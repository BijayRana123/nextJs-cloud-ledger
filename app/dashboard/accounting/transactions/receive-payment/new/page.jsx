"use client";

import ReceivePaymentForm from '@/app/components/accounting/ReceivePaymentForm';
import { useRouter } from 'next/navigation';

export default function AddReceiptVoucherPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/accounting/transactions/receive-payment');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Payment Received</h1>
      <ReceivePaymentForm onSuccess={handleSuccess} />
    </div>
  );
} 