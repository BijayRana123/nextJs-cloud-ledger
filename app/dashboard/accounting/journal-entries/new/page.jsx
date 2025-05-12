"use client";

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

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [memo, setMemo] = useState("");
  const [transactions, setTransactions] = useState([
    { account: null, amount: "", type: "debit", meta: {} },
    { account: null, amount: "", type: "credit", meta: {} },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountOptions, setAccountOptions] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Process account structure for dropdown options
  useEffect(() => {
    const options = [];
    
    // Process assets accounts
    accounts.assets.forEach(asset => {
      options.push(`assets:${asset}`);
    });
    
    // Process liabilities accounts
    accounts.liabilities.forEach(liability => {
      options.push(`liabilities:${liability}`);
    });
    
    // Process income accounts
    accounts.income.forEach(income => {
      options.push(`income:${income}`);
    });
    
    // Process expenses accounts
    accounts.expenses.forEach(expense => {
      options.push(`expenses:${expense}`);
    });
    
    // Process equity accounts
    accounts.equity.forEach(equity => {
      options.push(`equity:${equity}`);
    });
    
    setAccountOptions(options);
  }, []);

  // Add a new transaction row
  const addTransaction = () => {
    setTransactions([...transactions, { account: null, amount: "", type: "debit", meta: {} }]);
  };

  // Remove a transaction row
  const removeTransaction = (index) => {
    if (transactions.length <= 2) {
      setErrorMessage("A journal entry must have at least two transactions");
      return;
    }
    
    const updatedTransactions = [...transactions];
    updatedTransactions.splice(index, 1);
    setTransactions(updatedTransactions);
  };

  // Handle transaction input changes
  const handleTransactionChange = (index, field, value) => {
    const updatedTransactions = [...transactions];
    
    if (field === 'amount') {
      // Ensure amount is a valid number and store as a string for the input field
      const numValue = parseFloat(value);
      // Store as empty string if NaN, otherwise store the original string value
      updatedTransactions[index][field] = isNaN(numValue) ? '' : value;
      
      // Add debugging log for amount value
      console.log(`Transaction amount changed: value=${value}, parsed=${numValue}, type=${typeof numValue}`);
    } else {
      updatedTransactions[index][field] = value;
    }
    
    setTransactions(updatedTransactions);
    
    // Clear any previous error
    setErrorMessage("");
  };

  // Calculate totals for debits and credits
  const calculateTotals = () => {
    const debits = transactions
      .filter(t => t.type === "debit" && t.amount)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
    const credits = transactions
      .filter(t => t.type === "credit" && t.amount)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
    return { debits, credits, difference: Math.abs(debits - credits) };
  };

  // Check if form is valid
  const isFormValid = () => {
    // Check if memo is provided
    if (!memo.trim()) return false;
    
    // Check if all transactions have account, amount, and type
    for (const transaction of transactions) {
      if (!transaction.account || transaction.account === "placeholder" || !transaction.amount || !transaction.type) {
        return false;
      }
      
      // Ensure amount is a valid number
      if (isNaN(parseFloat(transaction.amount))) {
        return false;
      }
    }
    
    // Check if debits equal credits
    const { difference } = calculateTotals();
    return difference < 0.01; // Allow for small rounding errors
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!isFormValid()) {
      setErrorMessage("Please complete all required fields and ensure debits equal credits");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format transactions for API - ENSURE amounts are proper numbers
      const formattedTransactions = transactions.map(({ account, amount, type, description }) => {
        // Parse numeric value explicitly
        let numAmount;
        try {
          // First try direct conversion
          numAmount = Number(amount);
          
          // If that fails, try cleaning the string and parsing
          if (isNaN(numAmount)) {
            numAmount = parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
          }
          
          // Validation
          if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error(`Invalid amount for ${account}: ${amount}`);
          }
          
          // Ensure it's treated as a number in JSON
          numAmount = Number(numAmount.toFixed(2));
          
          console.log(`Formatted transaction amount: ${amount} => ${numAmount} (${typeof numAmount})`);
        } catch (error) {
          console.error(error);
          throw new Error(`Invalid amount for ${account}: ${amount}`);
        }
        
        return {
          account,
          amount: numAmount, // Explicitly as number
          type,
          meta: { description: description || "" },
        };
      });
      
      if (debugMode) {
        console.log("Formatted transactions for submission:", formattedTransactions);
        console.log("Data types:", formattedTransactions.map(t => 
          `${t.account}: ${t.amount} (${typeof t.amount})`
        ));
      }
      
      const response = await fetch("/api/accounting/journal-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memo,
          transactions: formattedTransactions,
        }),
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (debugMode) {
            console.error("API error response:", data);
            setDebugInfo({ apiErrorResponse: data });
          }
          throw new Error(data.error || "Failed to create journal entry");
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          if (debugMode) {
            console.error("API error text response:", text);
            setDebugInfo({ apiErrorText: text, status: response.status });
            // Check API status
            await checkApiStatus();
          }
          throw new Error(`Server error: ${response.status} ${text.substring(0, 100)}...`);
        }
      }
      
      let data;
      try {
        data = await response.json();
        if (debugMode) {
          console.log("API success response:", data);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        if (debugMode) {
          setDebugInfo({ jsonParseError: jsonError.message });
          await checkApiStatus();
        }
        throw new Error("Invalid response from server. Please try again.");
      }
      
      // Redirect to the journal entry detail page
      if (data && data.journalEntry) {
        // Check which ID field is available
        const entryId = data.journalEntry._id || data.journalEntry.journal_id || data.journalEntry.id;
        if (entryId) {
          router.push(`/dashboard/accounting/journal-entries/${entryId}`);
        } else {
          console.error("Journal entry created but no ID found in response:", data);
          setErrorMessage("Journal entry created but couldn't retrieve ID for redirection");
        }
      } else {
        console.error("Invalid response data:", data);
        setErrorMessage("Received invalid response after creating journal entry");
      }
    } catch (error) {
      console.error("Error creating journal entry:", error);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { debits, credits, difference } = calculateTotals();
  const isBalanced = difference < 0.01;

  // Function to check API status
  const checkApiStatus = async () => {
    try {
      const response = await fetch("/api/accounting/status");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">New Journal Entry</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting/journal-entries")}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="memo">Description/Memo</Label>
                <Textarea
                  id="memo"
                  placeholder="Enter a description for this journal entry"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  defaultValue={new Date().toISOString().substring(0, 10)}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Journal entries use the current date and time</p>
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
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <CustomTableRow key={index}>
                    <CustomTableCell>
                      <Select
                        value={transaction.account || "placeholder"}
                        onValueChange={(value) => handleTransactionChange(index, "account", value === "placeholder" ? null : value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>Select an account</SelectItem>
                          {accountOptions.map((account) => (
                            <SelectItem key={account} value={account}>
                              {account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                
                {/* Totals row */}
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
                          <span className={`ml-4 ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                            ${difference.toFixed(2)}
                          </span>
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
            {isSubmitting ? "Creating..." : "Create Journal Entry"}
          </Button>
        </div>
      </form>

      {/* Debug Panel */}
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
          {debugMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkApiStatus}
            >
              Check API Status
            </Button>
          )}
        </div>
        
        {debugMode && debugInfo && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 