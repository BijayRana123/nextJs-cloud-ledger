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
import Link from "next/link";
import { MoreVertical, FileEdit, Trash2, Printer, Plus } from "lucide-react";

export default function JournalEntryDetailPage({ params }) {
  // Unwrap params using React.use
  const unwrappedParams = use(params);
  const entryId = unwrappedParams.id;
  
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
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

  // Handle delete journal entry
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/accounting/journal-entries/${entryId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/dashboard/accounting/journal-entries');
      } else {
        const result = await response.json();
        setDeleteError(result.message || "Failed to delete journal entry");
      }
    } catch (err) {
      setDeleteError("An error occurred while deleting the journal entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.open(`/dashboard/accounting/journal-entries/${entryId}/print`, '_blank');
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
        <h1 className="text-2xl font-bold">Journal Entry Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/accounting/journal-entries')}>
            Back to Journal Entries
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => router.push('/dashboard/accounting/journal-entries/new')}>
            <Plus className="h-5 w-5 mr-2" /> Add New
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-5 w-5 mr-2" /> Print
          </Button>
          {!journalEntry.voided && (
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-5 w-5 mr-2" /> {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>
      {deleteError && <div className="text-red-600 mb-4">{deleteError}</div>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Journal Entry Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <div>{formatDate(journalEntry.datetime)}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Journal Voucher Reference Number:</span>
                  <div>{journalEntry.voucherNumber || "N/A"}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description:</span>
                  <div>{formatMemo(journalEntry.memo)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
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
                      ? transaction.account_path[transaction.account_path.length - 1] || transaction.account_path.join(":")
                      : (transaction.accounts ? transaction.accounts.split(':').pop() : "Unknown Account")}
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