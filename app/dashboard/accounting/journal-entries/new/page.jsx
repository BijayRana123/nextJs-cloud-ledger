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
import { Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner"; // Assuming you have a toast notification system
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [memo, setMemo] = useState("");
  const [transactions, setTransactions] = useState([
    { account: "", type: "debit", amount: 0 },
    { account: "", type: "credit", amount: 0 },
  ]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New account creation states
  const [isNewAccountSheetOpen, setIsNewAccountSheetOpen] = useState(false);
  const [currentTransactionIndex, setCurrentTransactionIndex] = useState(null);
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const [newAccount, setNewAccount] = useState({
    name: "",
    group: "",
    description: "",
    openingBalance: 0
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [nameValidation, setNameValidation] = useState({ isChecking: false, error: null });

  // Debounced name validation
  useEffect(() => {
    if (!newAccount.name.trim() || !currentOrganization?._id) {
      setNameValidation({ isChecking: false, error: null });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setNameValidation({ isChecking: true, error: null });
      
      try {
        const checkResponse = await fetch(`/api/accounting/ledgers/check-name?name=${encodeURIComponent(newAccount.name.trim())}`, {
          headers: {
            'x-organization-id': currentOrganization._id,
          },
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          
          if (checkData.exists) {
            const groupName = checkData.ledger?.group?.name || 'Unknown Group';
            setNameValidation({ 
              isChecking: false, 
              error: `A ledger named "${newAccount.name}" already exists in the "${groupName}" group.` 
            });
          } else {
            setNameValidation({ isChecking: false, error: null });
          }
        } else {
          setNameValidation({ isChecking: false, error: null });
        }
      } catch (error) {
        console.warn('Could not check ledger name:', error);
        setNameValidation({ isChecking: false, error: null });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [newAccount.name, currentOrganization?._id]);

  useEffect(() => {
    if (currentOrganization?._id) {
      setLoadingError(null);
      fetchAccounts();
      fetchLedgerGroups();
    }
  }, [currentOrganization]);

  const retryLoading = () => {
    setLoadingError(null);
    if (currentOrganization?._id) {
      fetchAccounts();
      fetchLedgerGroups();
    }
  };

  const fetchAccounts = async () => {
    if (!currentOrganization?._id) return;
    
    try {
      // Use the ledgers API instead of balances to get all accounts including newly created ones
      const response = await fetch(`/api/accounting/ledgers?_t=${Date.now()}`, {
        headers: {
          'x-organization-id': currentOrganization._id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Ledgers API error:', errorData);
        throw new Error(errorData.error || "Failed to fetch accounts");
      }
      
      const result = await response.json();
      const data = result.ledgers || [];
      
      // Deduplicate accounts by path using Map for better performance and reliability
      const accountMap = new Map();
      data.forEach(account => {
        if (!account.path) {
          console.warn('Account without path found:', account);
          return;
        }
        
        if (accountMap.has(account.path)) {
          const existing = accountMap.get(account.path);
          console.warn(`Duplicate account found: ${account.path}`, { existing, new: account });
          // Keep the one with more complete data
          if (account.name && (!existing.name || account.name.length > existing.name.length)) {
            accountMap.set(account.path, account);
          }
        } else {
          accountMap.set(account.path, account);
        }
      });
      
      const uniqueAccounts = Array.from(accountMap.values()).map((acc, index) => ({
        ...acc,
        uniqueId: `${acc._id || acc.path || 'unknown'}-${index}`
      }));
      
      console.log(`Loaded ${data.length} accounts, deduplicated to ${uniqueAccounts.length}`);
      
      // Additional debugging to check for duplicates
      const pathCounts = {};
      uniqueAccounts.forEach(acc => {
        pathCounts[acc.path] = (pathCounts[acc.path] || 0) + 1;
      });
      const duplicatePaths = Object.entries(pathCounts).filter(([path, count]) => count > 1);
      if (duplicatePaths.length > 0) {
        console.error('Still have duplicate paths after deduplication:', duplicatePaths);
        console.error('Duplicate accounts:', uniqueAccounts.filter(acc => 
          duplicatePaths.some(([path]) => path === acc.path)
        ));
      }
      
      setAccounts(uniqueAccounts);
    } catch (e) {
      console.error("Error fetching accounts:", e);
      setLoadingError('Failed to load accounts: ' + e.message);
      setAccounts([]);
    }
  };

  const fetchLedgerGroups = async (retryCount = 0) => {
    if (!currentOrganization?._id) return;
    
    try {
      const response = await fetch('/api/accounting/ledger-groups', {
        headers: {
          'x-organization-id': currentOrganization._id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Ledger groups API error:', errorData);
        
        // If it's a server error and we haven't retried too many times, try again
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Retrying ledger groups fetch (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return fetchLedgerGroups(retryCount + 1);
        }
        
        throw new Error(errorData.error || 'Failed to fetch ledger groups');
      }
      
      const data = await response.json();
      setLedgerGroups(data.groups || []);
    } catch (e) {
      console.error('Error fetching ledger groups:', e);
      setLoadingError('Failed to load ledger groups: ' + e.message);
      setLedgerGroups([]);
    }
  };

  const createNewAccount = async () => {
    if (!newAccount.name.trim() || !newAccount.group) {
      toast.error('Account name and group are required');
      return;
    }

    if (!currentOrganization?._id) {
      toast.error('Organization not found');
      return;
    }

    // Check validation state
    if (nameValidation.error) {
      toast.error(nameValidation.error);
      return;
    }

    if (nameValidation.isChecking) {
      toast.error('Please wait while we check the account name...');
      return;
    }

    setCreatingAccount(true);
    try {
      const response = await fetch('/api/accounting/ledgers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      toast.success('Account created successfully!');
      
      // Refresh accounts list and get the updated accounts
      await fetchAccounts();
      
      // If this was triggered from a transaction row, select the new account
      if (currentTransactionIndex !== null && data.ledger) {
        // Fetch fresh accounts data to find the new account
        try {
          const response = await fetch(`/api/accounting/ledgers?_t=${Date.now()}`, {
            headers: {
              'x-organization-id': currentOrganization._id,
            },
          });
          if (response.ok) {
            const result = await response.json();
            const freshAccountsData = result.ledgers || [];
            const newAccountData = freshAccountsData.find(acc => 
              acc.name.toLowerCase() === newAccount.name.toLowerCase()
            );
            
            if (newAccountData && newAccountData.path) {
              handleTransactionChange(currentTransactionIndex, "account", newAccountData.path);
            }
          }
        } catch (error) {
          console.error('Error fetching fresh accounts:', error);
        }
      }
      
      // Reset form and close sheet
      setNewAccount({ name: "", group: "", description: "", openingBalance: 0 });
      setNameValidation({ isChecking: false, error: null });
      setIsNewAccountSheetOpen(false);
      setCurrentTransactionIndex(null);
      
    } catch (err) {
      toast.error(err.message);
      console.error('Error creating account:', err);
    } finally {
      setCreatingAccount(false);
    }
  };

  const openNewAccountSheet = (transactionIndex = null) => {
    setCurrentTransactionIndex(transactionIndex);
    setNewAccount({ name: "", group: "", description: "", openingBalance: 0 });
    setNameValidation({ isChecking: false, error: null });
    setIsNewAccountSheetOpen(true);
  };

  const createBasicAccounts = async () => {
    if (!currentOrganization?._id) {
      toast.error('Organization not found');
      return;
    }

    try {
      setCreatingAccount(true);
      
      const response = await fetch('/api/accounting/setup-basic-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create basic accounts');
      }

      const data = await response.json();
      toast.success(data.message || 'Basic accounts created successfully!');
      
      // Refresh both accounts and ledger groups
      await Promise.all([fetchAccounts(), fetchLedgerGroups()]);
      
    } catch (err) {
      toast.error('Error creating basic accounts: ' + err.message);
      console.error('Error creating basic accounts:', err);
    } finally {
      setCreatingAccount(false);
    }
  };

  const createLedgerGroups = async () => {
    if (!currentOrganization?._id) {
      toast.error('Organization not found');
      return;
    }

    try {
      setCreatingAccount(true);
      
      const response = await fetch('/api/accounting/setup-ledger-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create ledger groups');
      }

      const data = await response.json();
      toast.success(data.message || 'Ledger groups created successfully!');
      
      // Refresh ledger groups
      await fetchLedgerGroups();
      
    } catch (err) {
      toast.error('Error creating ledger groups: ' + err.message);
      console.error('Error creating ledger groups:', err);
    } finally {
      setCreatingAccount(false);
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
          "x-organization-id": currentOrganization._id,
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
        console.error('API Error Response:', data);
        throw new Error(data.error || data.message || "Failed to create journal voucher");
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

  // Show loading state if organization is not loaded yet
  if (!currentOrganization) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading organization...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Journal Voucher</h1>
        <div className="flex gap-2">
          {ledgerGroups.length === 0 && (
            <Button 
              variant="secondary" 
              onClick={createLedgerGroups}
              disabled={creatingAccount}
            >
              {creatingAccount ? "Creating..." : "Create Ledger Groups"}
            </Button>
          )}
          {accounts.length === 0 && ledgerGroups.length > 0 && (
            <Button 
              variant="secondary" 
              onClick={createBasicAccounts}
              disabled={creatingAccount}
            >
              {creatingAccount ? "Creating..." : "Create Basic Accounts"}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
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
              {loadingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-800 mb-2">Loading Error</h4>
                  <p className="text-red-700 text-sm mb-3">{loadingError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryLoading}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                </div>
              )}
              
              {!loadingError && ledgerGroups.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Setup Required</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Your organization needs ledger groups to categorize accounts. Click "Create Ledger Groups" above to set up the standard accounting categories.
                  </p>
                </div>
              )}
              
              {!loadingError && accounts.length === 0 && ledgerGroups.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">No Accounts Found</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    You need to create some basic accounts before you can create journal entries. Click "Create Basic Accounts" above to set up essential accounts like Cash, Bank Account, etc.
                  </p>
                </div>
              )}
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
                        <div className="flex gap-2">
                          <Select
                            value={txn.account}
                            onValueChange={(value) =>
                              handleTransactionChange(index, "account", value)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((acc, accIndex) => (
                                <SelectItem key={`account-${accIndex}-transaction-${index}`} value={acc.path}>
                                  {acc.name} ({acc.path})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openNewAccountSheet(index)}
                            title="Add New Account"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* New Account Creation Sheet */}
      <Sheet open={isNewAccountSheetOpen} onOpenChange={setIsNewAccountSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Create New Account</SheetTitle>
            <SheetDescription>
              Add a new ledger account to your chart of accounts.
            </SheetDescription>
          </SheetHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account-name">Account Name *</Label>
              <Input
                id="account-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Enter account name"
                className={nameValidation.error ? "border-red-500" : ""}
              />
              {nameValidation.isChecking && (
                <p className="text-sm text-gray-500">Checking availability...</p>
              )}
              {nameValidation.error && (
                <p className="text-sm text-red-500">{nameValidation.error}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account-group">Ledger Group *</Label>
              {ledgerGroups.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-700 text-sm mb-2">
                    No ledger groups available. You need to create ledger groups first.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createLedgerGroups}
                    disabled={creatingAccount}
                  >
                    {creatingAccount ? "Creating..." : "Create Ledger Groups"}
                  </Button>
                </div>
              ) : (
                <Select
                  value={newAccount.group}
                  onValueChange={(value) => setNewAccount({ ...newAccount, group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ledger group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ledgerGroups.map((group) => (
                      <SelectItem key={group._id} value={group._id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account-description">Description</Label>
              <Input
                id="account-description"
                value={newAccount.description}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="opening-balance">Opening Balance</Label>
              <Input
                id="opening-balance"
                type="number"
                step="0.01"
                value={newAccount.openingBalance}
                onChange={(e) => setNewAccount({ ...newAccount, openingBalance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsNewAccountSheetOpen(false);
                setNewAccount({ name: "", group: "", description: "", openingBalance: 0 });
                setCurrentTransactionIndex(null);
              }}
              disabled={creatingAccount}
            >
              Cancel
            </Button>
            <Button
              onClick={createNewAccount}
              disabled={creatingAccount || !newAccount.name.trim() || !newAccount.group || nameValidation.error || nameValidation.isChecking}
            >
              {creatingAccount ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 
