import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomTableCell, CustomTableRow } from "@/components/ui/CustomTable";
import { accounts } from "@/lib/accountingClient";
import AccountAutocompleteInput from "@/components/accounting/AccountAutocompleteInput";

export default function ExpertPaymentForm({ mode = "pay-supplier", voucherNumber, setVoucherNumber }) {
  const router = useRouter();
  const [memo, setMemo] = useState("");
  const [transactions, setTransactions] = useState([
    { account: null, amount: "", type: "debit", meta: {} },
    { account: null, amount: "", type: "credit", meta: {} },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountOptions, setAccountOptions] = useState([]);
  const [paymentVoucherNumber, setPaymentVoucherNumber] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  // Sync voucher number from prop
  useEffect(() => {
    setPaymentVoucherNumber(voucherNumber || "");
  }, [voucherNumber]);

  // For payment, suggest common accounts
  useEffect(() => {
    const options = [];
    accounts.liabilities.forEach(liability => {
      options.push(`liabilities:${liability}`);
    });
    accounts.assets.forEach(asset => {
      options.push(`assets:${asset}`);
    });
    setAccountOptions(options);
  }, []);

  useEffect(() => {
    if (mode === 'receive-payment') {
      // Fetch customers for receive-payment mode
      const fetchCustomers = async () => {
        try {
          const response = await fetch('/api/organization/customers');
          const data = await response.json();
          if (response.ok) {
            setCustomers(data.customers || []);
          }
        } catch (error) {
          // ignore
        }
      };
      fetchCustomers();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'pay-supplier') {
      // Fetch suppliers for pay-supplier mode
      const fetchSuppliers = async () => {
        try {
          const response = await fetch('/api/organization/suppliers');
          const data = await response.json();
          if (response.ok) {
            setSuppliers(data.suppliers || []);
          }
        } catch (error) {
          // ignore
        }
      };
      fetchSuppliers();
    }
  }, [mode]);

  const addTransaction = () => {
    setTransactions([...transactions, { account: null, amount: "", type: "debit", meta: {} }]);
  };

  const removeTransaction = (index) => {
    if (transactions.length <= 2) {
      setErrorMessage("A payment must have at least two transactions");
      return;
    }
    const updatedTransactions = [...transactions];
    updatedTransactions.splice(index, 1);
    setTransactions(updatedTransactions);
  };

  const handleTransactionChange = (index, field, value) => {
    const updatedTransactions = [...transactions];
    if (field === 'amount') {
      const numValue = parseFloat(value);
      updatedTransactions[index][field] = isNaN(numValue) ? '' : value;
    } else {
      updatedTransactions[index][field] = value;
    }
    setTransactions(updatedTransactions);
    setErrorMessage("");
  };

  const handleVoucherNumberChange = (e) => {
    // No-op: read-only
  };

  const calculateTotals = () => {
    const debits = transactions
      .filter(t => t.type === "debit" && t.amount)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const credits = transactions
      .filter(t => t.type === "credit" && t.amount)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { debits, credits, difference: Math.abs(debits - credits) };
  };

  const isFormValid = () => {
    if (!memo.trim() || !voucherNumber.trim()) return false;
    for (const transaction of transactions) {
      if (!transaction.account || !transaction.amount || !transaction.type) {
        return false;
      }
      if (isNaN(parseFloat(transaction.amount))) {
        return false;
      }
    }
    const { difference } = calculateTotals();
    return difference < 0.01;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setErrorMessage("Please complete all required fields and ensure debits equal credits");
      return;
    }
    setIsSubmitting(true);
    try {
      const formattedTransactions = transactions.map(({ account, amount, type, description }) => {
        let numAmount;
        try {
          numAmount = Number(amount);
          if (isNaN(numAmount)) {
            numAmount = parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
          }
          if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error(`Invalid amount for ${account}: ${amount}`);
          }
          numAmount = Number(numAmount.toFixed(2));
        } catch (error) {
          throw new Error(`Invalid amount for ${account}: ${amount}`);
        }
        return {
          account,
          amount: numAmount,
          type,
          meta: { description: description || "" },
        };
      });

      let response;
      if (mode === 'receive-payment') {
        // Use the new receipt voucher API
        const creditTxn = formattedTransactions.find(t => t.type === 'credit');
        const debitTxn = formattedTransactions.find(t => t.type === 'debit');
        
        response = await fetch('/api/organization/receipt-vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: selectedCustomer, // Use the dropdown value
            amount: debitTxn?.amount || 0,
            paymentMethod: debitTxn?.account?.split(':')[1] || 'Cash', // Simplification
            notes: memo,
          }),
        });
      } else if (mode === 'pay-supplier') {
        // Use the new payment voucher API
        const debitTxn = formattedTransactions.find(t => t.type === 'debit');
        response = await fetch('/api/organization/payment-vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId: selectedSupplier, // Use the dropdown value
            amount: debitTxn?.amount || 0,
            paymentMethod: ['Cash', 'Bank', 'Check', 'CreditCard'].includes(debitTxn?.account?.split(':')[1]) ? debitTxn?.account?.split(':')[1] : 'Cash',
            notes: memo,
          }),
        });
      } else {
        // Existing logic for other modes
        response = await fetch("/api/accounting/journal-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memo: memo || "Payment to Supplier (Expert Entry)",
            transactions: formattedTransactions,
            meta: { paymentVoucherNumber: voucherNumber, entryMode: 'expert' },
          }),
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (response.status === 405) {
          throw new Error("Invalid API endpoint or method. Please contact support.");
        }
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create payment entry");
        } else {
          const text = await response.text();
          throw new Error(`Server error: ${response.status} ${text.substring(0, 100)}...`);
        }
      }
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response from server. Please try again.");
      }
      if (data && data.paymentVoucher && data.paymentVoucher._id) {
        const voucherId = data.paymentVoucher._id;
        const maxRetries = 5;
        let attempt = 0;
        const checkVoucherExists = async () => {
          try {
            const res = await fetch(`/api/organization/payment-vouchers/${voucherId}`);
            if (res.ok) {
              router.push(`/dashboard/accounting/transactions/pay-supplier/${voucherId}`);
              return;
            }
          } catch {}
          attempt++;
          if (attempt < maxRetries) {
            setTimeout(checkVoucherExists, 500);
          } else {
            // Fallback: redirect anyway
            router.push(`/dashboard/accounting/transactions/pay-supplier/${voucherId}`);
          }
        };
        setTimeout(checkVoucherExists, 300);
        return;
      }
      if (data && data.journalEntry) {
        const entryId = data.journalEntry._id || data.journalEntry.journal_id || data.journalEntry.id;
        if (entryId) {
          router.push(`/dashboard/accounting/journal-entries/${entryId}`);
        } else {
          setErrorMessage("Payment entry created but couldn't retrieve ID for redirection");
        }
      } else {
        setErrorMessage("Received invalid response after creating payment entry");
      }
      if (mode === 'receive-payment') {
        if (data && data._id) {
          router.push(`/dashboard/accounting/transactions/receive-payment/${data._id}`);
          return;
        } else if (data && data.receiptVoucher && data.receiptVoucher._id) {
          router.push(`/dashboard/accounting/transactions/receive-payment/${data.receiptVoucher._id}`);
          return;
        } else {
          setErrorMessage("Received invalid response after creating payment entry");
          return;
        }
      }
      if (mode === 'pay-supplier') {
        if (data && data._id) {
          router.push(`/dashboard/accounting/transactions/pay-supplier/${data._id}`);
          return;
        } else if (data && data.paymentVoucher && data.paymentVoucher._id) {
          router.push(`/dashboard/accounting/transactions/pay-supplier/${data.paymentVoucher._id}`);
          return;
        } else {
          setErrorMessage("Received invalid response after creating payment entry");
          return;
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { debits, credits, difference } = calculateTotals();
  const isBalanced = difference < 0.01;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            {mode === 'receive-payment' && (
              <div className="flex flex-col space-y-1.5 md:w-1/2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select id="customerId" value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {mode === 'pay-supplier' && (
              <div className="flex flex-col space-y-1.5 md:w-1/2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <Select id="supplierId" value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col space-y-1.5 md:w-1/2">
              <Label>Receipt Voucher Number</Label>
              <div className="text-gray-500 text-sm">Voucher number will be generated after saving.</div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <CustomTableRow key={index}>
                  <CustomTableCell>
                    <AccountAutocompleteInput
                      accountOptions={accountOptions}
                      value={transaction.account}
                      onChange={val => handleTransactionChange(index, "account", val)}
                      placeholder="Select or type account"
                      required
                    />
                  </CustomTableCell>
                  <CustomTableCell>
                    <Select
                      value={transaction.type}
                      onValueChange={(value) => handleTransactionChange(index, "type", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </CustomTableCell>
                  <CustomTableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={transaction.amount}
                      onChange={(e) => handleTransactionChange(index, "amount", e.target.value)}
                      required
                    />
                  </CustomTableCell>
                  <CustomTableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTransaction(index)}
                    >
                      Remove
                    </Button>
                  </CustomTableCell>
                </CustomTableRow>
              ))}
              <CustomTableRow>
                <CustomTableCell colSpan={2} className="font-bold">
                  Totals
                </CustomTableCell>
                <CustomTableCell colSpan={2}>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Debits:</span>
                        <span className="ml-4">${debits.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credits:</span>
                        <span className="ml-4">${credits.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Difference:</span>
                        <span className={`ml-4 ${isBalanced ? "text-green-600" : "text-red-600"}`}>${difference.toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTransaction}
                      >
                        Add Row
                      </Button>
                    </div>
                  </div>
                </CustomTableCell>
              </CustomTableRow>
            </TableBody>
          </Table>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              {errorMessage}
            </div>
          )}
          {/* Description/Memo field below the table */}
          <div className="flex flex-col space-y-1.5 mt-6">
            <Label htmlFor="memo">Description / Memo *</Label>
            <Textarea
              id="memo"
              placeholder="Enter a description for this payment"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/accounting/journal-entries")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
        >
          {isSubmitting ? "Creating..." : "Create Payment Entry"}
        </Button>
      </div>
    </form>
  );
} 
