"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner"; // Assuming you have a toast notification system

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [memo, setMemo] = useState("");
  const [transactions, setTransactions] = useState([
    { account: "", type: "debit", amount: 0 },
    { account: "", type: "credit", amount: 0 },
  ]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounting?action=balances");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (e) {
      console.error("Error fetching accounts:", e);
      setAccounts([]);
    }
  };

  const handleTransactionChange = (index, field, value) => {
    const newTransactions = [...transactions];
    if (field === "amount") {
      newTransactions[index][field] = parseFloat(value) || 0;
    } else {
      newTransactions[index][field] = value;
    }
    setTransactions(newTransactions);
  };

  const addTransactionRow = () => {
    setTransactions([
      ...transactions,
      { account: "", type: "debit", amount: 0 },
    ]);
  };

  const removeTransactionRow = (index) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(newTransactions);
  };

  const calculateTotal = (type) => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  };

  const totalDebits = parseFloat(calculateTotal("debit"));
  const totalCredits = parseFloat(calculateTotal("credit"));
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow small rounding differences

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!memo.trim()) {
      setError("Memo is required.");
      setLoading(false);
      return;
    }

    if (transactions.some(t => !t.account || t.amount <= 0)) {
        setError("All transaction rows must have an account and a positive amount.");
        setLoading(false);
        return;
    }

    if (!isBalanced) {
      setError("Debits must equal credits to create a journal voucher.");
      setLoading(false);
      return;
    }

    try {

      
      const response = await fetch("/api/accounting/journal-vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memo, transactions }),
      });

      // Log the raw response for debugging
      const responseText = await response.text();


      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response that failed to parse:', responseText);
        throw new Error('Invalid response from server: ' + responseText.substring(0, 100));
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create journal voucher");
      }

      toast.success("Journal voucher created successfully!");
      router.push(`/dashboard/accounting/journal-entries/${data.journalVoucher.journalId || data.journalVoucher._id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Journal Voucher</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journal Voucher Details</CardTitle>
          <CardDescription>
            Record a new general journal voucher by specifying a memo and individual debit and credit transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold mt-4 mb-2">Transactions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn, index) => (
                    <TableRow key={index}>
                      <TableCell className="w-[200px]">
                        <Select
                          value={txn.account}
                          onValueChange={(value) =>
                            handleTransactionChange(index, "account", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.path} value={acc.path}>
                                {acc.name} ({acc.path})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <Select
                          value={txn.type}
                          onValueChange={(value) =>
                            handleTransactionChange(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <Input
                          type="number"
                          value={txn.amount}
                          onChange={(e) =>
                            handleTransactionChange(index, "amount", e.target.value)
                          }
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTransactionRow(index)}
                          disabled={transactions.length <= 2} // Ensure at least two lines for debit/credit
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={addTransactionRow}
              >
                Add Transaction Row
              </Button>

              <div className="flex justify-end gap-4 mt-4 text-lg font-semibold">
                <span>Total Debits: ${totalDebits}</span>
                <span>Total Credits: ${totalCredits}</span>
              </div>
              {!isBalanced && (
                <p className="text-right text-red-500 text-sm">
                  Debits and Credits must balance. Difference: $
                  {(totalDebits - totalCredits).toFixed(2)}
                </p>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="grid gap-2 mt-6">
                <Label htmlFor="memo">Memo/Description</Label>
                <Input
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Enter a brief description for the voucher"
                />
            </div>
            <CardFooter className="flex justify-end mt-6 p-0">
              <Button type="submit" disabled={loading || !isBalanced}>
                {loading ? "Creating..." : "Create Journal Voucher"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
