"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CustomTableCell, CustomTableRow } from "@/components/ui/CustomTable";
import { Input } from "@/components/ui/input";

export default function JournalEntryDetailPage({ params }) {
  // Unwrap params using React.use
  const unwrappedParams = use(params);
  const entryId = unwrappedParams.id;
  
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidingEntry, setVoidingEntry] = useState(false);
  const [error, setError] = useState(null);
  const [entityData, setEntityData] = useState({
    customer: null,
    supplier: null
  });

  useEffect(() => {
    // Fetch journal entry details from the API
    const fetchJournalEntry = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching journal entry with ID:", entryId);
        const response = await fetch(`/api/accounting/journal-entries/${entryId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch journal entry");
        }
        
        const data = await response.json();
        console.log("Journal entry data:", data);
        
        if (data.journalEntry) {
          // Ensure all transaction amounts exist and are numbers
          if (data.journalEntry.transactions) {
            data.journalEntry.transactions = data.journalEntry.transactions.map(transaction => {
              // Log the original transaction amount for debugging
              console.log(`Transaction ${transaction._id} original amount:`, {
                amount: transaction.amount,
                type: typeof transaction.amount
              });
              
              // Parse amount to ensure it's a proper number
              let numAmount;
              try {
                if (typeof transaction.amount === 'number' && !isNaN(transaction.amount)) {
                  numAmount = transaction.amount;
                } else {
                  numAmount = parseFloat(String(transaction.amount).replace(/[^0-9.-]+/g, ''));
                }
                
                // If still NaN or zero, use a default value
                if (isNaN(numAmount) || numAmount <= 0) {
                  console.error(`Invalid amount detected in client: ${transaction._id}, ${transaction.amount}`);
                  numAmount = 1.00;
                }
              } catch (error) {
                console.error('Error processing transaction amount in client:', error);
                numAmount = 1.00;
              }
              
              // Log the processed amount for debugging
              console.log(`Transaction ${transaction._id} processed amount: ${numAmount} (${typeof numAmount})`);
              
              return {
                ...transaction,
                amount: numAmount,
                account_path: Array.isArray(transaction.account_path) ? transaction.account_path : []
              };
            });
            
            // Log all processed transactions
            console.log('All processed transactions:', data.journalEntry.transactions.map(t => ({
              id: t._id,
              amount: t.amount,
              type: typeof t.amount
            })));
          }
          
          setJournalEntry(data.journalEntry);
        } else {
          console.error("Invalid journal entry data:", data);
          setError("Invalid journal entry data received");
        }
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (entryId) {
      fetchJournalEntry();
    }
  }, [entryId]);

  // Fetch customer/supplier data if present in transactions
  useEffect(() => {
    if (!journalEntry || !journalEntry.transactions || journalEntry.transactions.length === 0) return;
    
    const fetchEntityData = async () => {
      try {
        const firstTransaction = journalEntry.transactions[0];
        const meta = firstTransaction.meta || {};
        
        // Check for customer ID in meta
        if (meta.customerId && typeof meta.customerId === 'string') {
          try {
            const response = await fetch(`/api/organization/customers/${meta.customerId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.customer) {
                setEntityData(prev => ({ ...prev, customer: data.customer }));
              }
            }
          } catch (error) {
            console.error('Error fetching customer data:', error);
          }
        }
        
        // Check for supplier ID in meta
        if (meta.supplierId && typeof meta.supplierId === 'string') {
          try {
            const response = await fetch(`/api/organization/suppliers/${meta.supplierId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.supplier) {
                setEntityData(prev => ({ ...prev, supplier: data.supplier }));
              }
            }
          } catch (error) {
            console.error('Error fetching supplier data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching entity data:', error);
      }
    };
    
    fetchEntityData();
  }, [journalEntry]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  // Handle void journal entry
  const handleVoidJournalEntry = async () => {
    try {
      setVoidingEntry(true);
      
      const response = await fetch(`/api/accounting/journal-entries/${entryId}/void`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: voidReason }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to void journal entry");
      }
      
      const data = await response.json();
      
      // Refresh journal entry data
      setJournalEntry(data.journalEntry);
      setVoidDialogOpen(false);
    } catch (error) {
      console.error("Error voiding journal entry:", error);
      alert("Error voiding journal entry: " + error.message);
    } finally {
      setVoidingEntry(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p>Loading journal entry details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center items-center h-40">
              <p className="text-red-500 mb-2">Error: {error}</p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard/accounting/journal-entries")}
              >
                Back to Journal Entries
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!journalEntry) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p>Journal entry not found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure transactions array exists
  const transactions = journalEntry.transactions || [];
  
  // Format memo text to display customer names instead of IDs
  const formatMemo = (memo) => {
    if (!memo) return "N/A";
    
    // Get entity data from state
    const { customer, supplier } = entityData;
    
    // If we have customer data, use it in the memo
    if (customer) {
      if (memo.includes("Payment Received from Customer")) {
        // Replace customer ID with name, keeping invoice reference if present
        if (memo.includes(" for Invoice ")) {
          const invoiceRef = memo.split(" for Invoice ")[1];
          return `Payment Received from Customer ${customer.name} for Invoice ${invoiceRef}`;
        } else {
          return `Payment Received from Customer ${customer.name}`;
        }
      }
      
      if (memo.includes("Sales Order to Customer")) {
        return `Sales Order to Customer ${customer.name}`;
      }
    }
    
    // If we have supplier data, use it in the memo
    if (supplier) {
      if (memo.includes("Payment Sent to Supplier")) {
        // Replace supplier ID with name, keeping bill reference if present
        if (memo.includes(" for Bill ")) {
          const billRef = memo.split(" for Bill ")[1];
          return `Payment Sent to Supplier ${supplier.name} for Bill ${billRef}`;
        } else {
          return `Payment Sent to Supplier ${supplier.name}`;
        }
      }
      
      if (memo.includes("Purchase Order from Supplier")) {
        return `Purchase Order from Supplier ${supplier.name}`;
      }
    }
    
    // For various transaction types where we couldn't fetch the entity data
    if (memo.includes("Payment Received from Customer")) {
      // If memo has MongoDB ObjectId, replace it with generic "Customer"
      const match = memo.match(/Customer ([0-9a-f]{24})/);
      if (match) {
        if (memo.includes(" for Invoice ")) {
          const invoiceRef = memo.split(" for Invoice ")[1];
          return `Payment Received from Customer for Invoice ${invoiceRef}`;
        } else {
          return "Payment Received from Customer";
        }
      }
    }
    
    if (memo.includes("Payment Sent to Supplier")) {
      // If memo has MongoDB ObjectId, replace it with generic "Supplier"
      const match = memo.match(/Supplier ([0-9a-f]{24})/);
      if (match) {
        if (memo.includes(" for Bill ")) {
          const billRef = memo.split(" for Bill ")[1];
          return `Payment Sent to Supplier for Bill ${billRef}`;
        } else {
          return "Payment Sent to Supplier";
        }
      }
    }
    
    if (memo.includes("Sales Order to Customer")) {
      // If memo has MongoDB ObjectId, replace it with generic "Customer"
      return memo.replace(/Customer [0-9a-f]{24}/, "Customer");
    }
    
    if (memo.includes("Purchase Order from Supplier")) {
      // If memo has MongoDB ObjectId, replace it with generic "Supplier"
      return memo.replace(/Supplier [0-9a-f]{24}/, "Supplier");
    }
    
    return memo;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Journal Entry Details</h1>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/accounting/journal-entries")}
          >
            Back to Journal Entries
          </Button>
          {!journalEntry.voided && (
            <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Void Entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Void Journal Entry</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="mb-4">
                    Are you sure you want to void this journal entry? This action cannot be undone.
                  </p>
                  <Input
                    placeholder="Reason for voiding"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setVoidDialogOpen(false)}
                    disabled={voidingEntry}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleVoidJournalEntry}
                    disabled={voidingEntry || !voidReason.trim()}
                  >
                    {voidingEntry ? "Voiding..." : "Void Entry"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Voucher Number:</dt>
                <dd>{journalEntry.voucherNumber || journalEntry.transactions?.[0]?.meta?.voucherNumber || journalEntry.transactions?.[0]?.meta?.invoiceNumber || journalEntry.transactions?.[0]?.meta?.billNumber || "N/A"}</dd>
                </div>
              <div className="flex justify-between">
                <dt className="font-medium">Date:</dt>
                <dd>{formatDate(journalEntry.datetime)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Description:</dt>
                <dd>{formatMemo(journalEntry.memo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Status:</dt>
                <dd>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    journalEntry.voided
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {journalEntry.voided ? "Voided" : "Active"}
                  </span>
                </dd>
              </div>
              {journalEntry.voided && (
                <>
                  <div className="flex justify-between">
                    <dt className="font-medium">Void Reason:</dt>
                    <dd>{journalEntry.void_reason || "No reason provided"}</dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <CustomTableRow key={transaction._id || index}>
                    <CustomTableCell>
                      {Array.isArray(transaction.account_path) 
                        ? transaction.account_path.join(":") 
                        : transaction.accounts || "Unknown Account"}
                    </CustomTableCell>
                    <CustomTableCell>
                      {transaction.debit ? "Debit" : "Credit"}
                    </CustomTableCell>
                    <CustomTableCell className="text-right">
                      {transaction.debit ? `$${(parseFloat(transaction.amount) || 1.00).toFixed(2)}` : ""}
                    </CustomTableCell>
                    <CustomTableCell className="text-right">
                      {!transaction.debit ? `$${(parseFloat(transaction.amount) || 1.00).toFixed(2)}` : ""}
                    </CustomTableCell>
                  </CustomTableRow>
                ))}
                
                {/* Totals row */}
                <CustomTableRow>
                  <CustomTableCell colSpan={2} className="font-bold">
                    Totals
                  </CustomTableCell>
                  <CustomTableCell className="text-right font-bold">
                    $
                    {transactions
                      .filter(t => t.debit)
                      .reduce((sum, t) => {
                        const amount = parseFloat(t.amount);
                        return sum + (isNaN(amount) || amount <= 0 ? 1.00 : amount);
                      }, 0)
                      .toFixed(2)}
                  </CustomTableCell>
                  <CustomTableCell className="text-right font-bold">
                    $
                    {transactions
                      .filter(t => !t.debit)
                      .reduce((sum, t) => {
                        const amount = parseFloat(t.amount);
                        return sum + (isNaN(amount) || amount <= 0 ? 1.00 : amount);
                      }, 0)
                      .toFixed(2)}
                  </CustomTableCell>
                </CustomTableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {journalEntry.meta && Object.keys(journalEntry.meta).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(journalEntry.meta).map(([key, value]) => (
                <div key={key} className="border rounded p-3">
                  <div className="font-medium text-sm text-gray-500">{key}</div>
                  <div>{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

   
      </div>
  );
} 