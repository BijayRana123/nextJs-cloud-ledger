"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Utility to infer voucher type from voucherNumber or memo
function getVoucherType(voucherNumber, memo) {
  if (voucherNumber) {
    if (voucherNumber.startsWith("JV-")) return "Journal Voucher";
    if (voucherNumber.startsWith("CV-")) return "Contra Voucher";
    if (voucherNumber.startsWith("SV-")) return "Sales Voucher";
    if (voucherNumber.startsWith("SRV-")) return "Sales Return Voucher";
    if (voucherNumber.startsWith("PV-")) return "Purchase Voucher";
    if (voucherNumber.startsWith("PRV-")) return "Purchase Return Voucher";
    if (voucherNumber.startsWith("PaV-")) return "Payment Voucher";
    if (voucherNumber.startsWith("RcV-")) return "Receipt Voucher";
    if (voucherNumber.startsWith("EV-")) return "Expense Voucher";
    if (voucherNumber.startsWith("IV-")) return "Income Voucher";
  }
  // Fallback to memo
  if (memo) {
    if (/sales order|sales voucher/i.test(memo)) return "Sales Voucher";
    if (/sales return/i.test(memo)) return "Sales Return Voucher";
    if (/purchase order|purchase voucher/i.test(memo)) return "Purchase Voucher";
    if (/purchase return/i.test(memo)) return "Purchase Return Voucher";
    if (/payment sent|pay supplier/i.test(memo)) return "Payment Voucher";
    if (/payment received|receive payment/i.test(memo)) return "Receipt Voucher";
    if (/journal/i.test(memo)) return "Journal Voucher";
    if (/contra/i.test(memo)) return "Contra Voucher";
    if (/expense/i.test(memo)) return "Expense Voucher";
    if (/income/i.test(memo)) return "Income Voucher";
  }
  return "Other";
}

function getVoucherDetailRoute(type, id) {
  switch (type) {
    case "Sales Voucher": return `/dashboard/sales/sales-vouchers/${id}`;
    case "Sales Return Voucher": return `/dashboard/sales/sales-return-vouchers/${id}`;
    case "Purchase Voucher": return `/dashboard/purchase/purchase-bills/${id}`;
    case "Purchase Return Voucher": return `/dashboard/purchase/purchase-return-vouchers/${id}`;
    case "Payment Voucher": return `/dashboard/accounting/transactions/pay-supplier/${id}`;
    case "Receipt Voucher": return `/dashboard/accounting/transactions/receive-payment/${id}`;
    case "Journal Voucher": return `/dashboard/accounting/journal-entries/${id}`;
    case "Contra Voucher": return `/dashboard/accounting/transactions/contra-voucher/${id}`;
    case "Expense Voucher": return `/dashboard/accounting/transactions/record-expense/${id}`;
    case "Income Voucher": return `/dashboard/accounting/transactions/record-income/${id}`;
    default: return `/dashboard/accounting/reports/day-book/${id}`;
  }
}

const fetchOrder = async (url, key) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const result = await response.json();
    if (result && result[key]) return result[key];
    return null;
  } catch {
    return null;
  }
};

export default function DayBookRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const tryAllApis = async () => {
      setLoading(true);
      setError(null);
      // Try all APIs in order
      const apis = [
        { url: `/api/accounting/journal-entries/${id}`, key: 'journalEntry', type: 'journal' },
        { url: `/api/organization/sales-vouchers/${id}`, key: 'salesVoucher', type: 'sales' },
        { url: `/api/organization/sales-return-vouchers/${id}`, key: 'salesReturnVoucher', type: 'salesReturn' },
        { url: `/api/organization/purchase-vouchers/${id}`, key: 'purchaseVoucher', type: 'purchase' },
        { url: `/api/organization/purchase-return-vouchers/${id}`, key: 'purchaseReturnVoucher', type: 'purchaseReturn' },
        { url: `/api/accounting/vouchers/contra/${id}`, key: 'contraVoucher', type: 'contra' },
        { url: `/api/accounting/vouchers/expense/${id}`, key: 'expenseVoucher', type: 'expense' },
        { url: `/api/accounting/vouchers/income/${id}`, key: 'incomeVoucher', type: 'income' },
        { url: `/api/accounting/vouchers/payment/${id}`, key: 'paymentVoucher', type: 'payment' },
        { url: `/api/accounting/vouchers/receipt/${id}`, key: 'receiptVoucher', type: 'receipt' },
      ];
      for (const api of apis) {
        const entry = await fetchOrder(api.url, api.key);
        if (entry) {
          // Try to get voucherNumber and memo for type detection
          const voucherNumber = entry.voucherNumber || entry.salesVoucherNumber || entry.referenceNo || entry.paymentVoucherNumber || entry.receiptVoucherNumber;
          const memo = entry.memo || entry.description || entry.notes;
          const type = getVoucherType(voucherNumber, memo);
          const detailRoute = getVoucherDetailRoute(type, id);
          router.replace(detailRoute);
          return;
        }
      }
      setError('Entry not found in any voucher type.');
      setLoading(false);
    };
    tryAllApis();
  }, [id, router]);

  if (loading) return <div className="p-4">Redirecting to voucher detail...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  return null;
} 