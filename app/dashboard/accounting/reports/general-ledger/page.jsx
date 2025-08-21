"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionalDatePicker } from "@/components/ConditionalDatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Printer, Download, RefreshCw, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCookie } from '@/lib/utils';
import { toast } from "@/components/ui/use-toast";
import { useOrganization } from "@/lib/context/OrganizationContext";

export default function GeneralLedgerPage() {
  const router = useRouter();
  const { isNepaliCalendar } = useCalendar();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState(new Date());
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAccounts, setExpandedAccounts] = useState({});
  // New states for Class and Subclass dropdowns
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubclass, setSelectedSubclass] = useState("all");
  const [subclassOptions, setSubclassOptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const { currentOrganization } = useOrganization();

  // List of accounts for the select dropdown
  const accounts = [
    { id: "all", name: "All Accounts" },
    { id: "assets", name: "Assets" },
    { id: "liabilities", name: "Liabilities" },
    { id: "equity", name: "Equity" },
    { id: "revenue", name: "Revenue" },
    { id: "expenses", name: "Expenses" },
  ];

  // List of account classes for the class dropdown
  const accountClasses = [
    { id: "all", name: "All Classes" },
    { id: "accounts-receivable", name: "Accounts Receivable" },
    { id: "accounts-payable", name: "Accounts Payable" },
    { id: "cash-bank", name: "Cash and Bank" },
    { id: "assets", name: "Assets" },
    { id: "liabilities", name: "Liabilities" },
    { id: "income", name: "Income" },
    { id: "expenses", name: "Expenses" },
    { id: "others", name: "Others" },
  ];

  // Toggle account expansion
  const toggleAccountExpansion = (accountId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Handle period type change
  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    // Reset dates based on period
    const now = new Date();
    if (value === "month") {
      // Current month
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setEndDate(now);
    } else if (value === "quarter") {
      // Current quarter
      const quarter = Math.floor(now.getMonth() / 3);
      setStartDate(new Date(now.getFullYear(), quarter * 3, 1));
      setEndDate(now);
    } else if (value === "year") {
      // Current year
      setStartDate(new Date(now.getFullYear(), 0, 1));
      setEndDate(now);
    } else if (value === "custom") {
      // Keep current dates for custom period
    }
  };

  // Fetch customers and suppliers
  useEffect(() => {
    const fetchCustomersAndSuppliers = async () => {
      try {
        // Get auth token from cookie
        const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
        
        if (!authToken) {
          console.error("Authentication token not found in cookie.");
          return;
        }

        // Fetch customers and suppliers in parallel
        const [customersResponse, suppliersResponse] = await Promise.all([
          fetch('/api/organization/customers', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/organization/suppliers', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          })
        ]);

        // Handle customers
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          if (customersData.customers && Array.isArray(customersData.customers)) {
            setCustomers(customersData.customers);
          } else {
            console.error("Unexpected customers data structure:", customersData);
          }
        } else {
          console.error("Failed to fetch customers:", customersResponse.status);
        }

        // Handle suppliers
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          if (suppliersData.suppliers && Array.isArray(suppliersData.suppliers)) {
            setSuppliers(suppliersData.suppliers);
          } else {
            console.error("Unexpected suppliers data structure:", suppliersData);
          }
        } else {
          console.error("Failed to fetch suppliers:", suppliersResponse.status);
        }

        // For now, we'll mock cash accounts until we have a proper endpoint
        setCashAccounts([
          { _id: 'bank-main', name: 'Bank - Main Account' },
          { _id: 'bank-savings', name: 'Bank - Savings Account' },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchCustomersAndSuppliers();
  }, []);

  // Update subclass options when class changes
  useEffect(() => {
    if (selectedClass === 'accounts-receivable') {
      setSubclassOptions(customers.map(customer => ({
        id: customer._id,
        name: customer.name || customer.displayName || 'Unnamed Customer'
      })));
    } else if (selectedClass === 'accounts-payable') {
      setSubclassOptions(suppliers.map(supplier => ({
        id: supplier._id,
        name: supplier.name || supplier.displayName || 'Unnamed Supplier'
      })));
    } else if (selectedClass === 'cash-bank') {
      setSubclassOptions(cashAccounts.map(account => ({
        id: account._id,
        name: account.name
      })));
    } else {
      setSubclassOptions([]);
    }
    
    // Reset subclass selection when class changes
    setSelectedSubclass('all');
  }, [selectedClass, customers, suppliers, cashAccounts]);

  // Generate ledger report
  const generateReport = async () => {
    if (!currentOrganization || !currentOrganization._id) {
      console.warn("No current organization selected, skipping report generation.");
      setIsLoading(false);
      return;
    }
    try {
      // Build report query parameters
      const reportParams = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        account: selectedAccount !== 'all' ? selectedAccount : null,
        organizationId: currentOrganization?._id || null,
      };


      // Add class and subclass filters if selected
      if (selectedClass !== 'all') {
        reportParams.class = selectedClass;
        
        // For cash and bank accounts, we need to filter by the path
        if (selectedClass === 'cash-bank') {
          reportParams.accountPath = 'Assets:Current Assets:Cash and Bank';
          
          if (selectedSubclass !== 'all') {
            // If a specific cash account is selected
            const selectedAccount = cashAccounts.find(acc => acc._id === selectedSubclass);
            if (selectedAccount) {
              reportParams.accountName = selectedAccount.name;
            }
          }
        } else if (selectedClass === 'accounts-receivable') {
          reportParams.accountPath = 'Assets:Current Assets:Accounts Receivable';
          
          if (selectedSubclass !== 'all') {
            // If a specific customer is selected
            const selectedCustomer = customers.find(cust => cust._id === selectedSubclass);
            if (selectedCustomer) {
              reportParams.entityName = selectedCustomer.name || selectedCustomer.displayName;
              reportParams.entityType = 'customer';
            }
          }
        } else if (selectedClass === 'accounts-payable') {
          reportParams.accountPath = 'Liabilities:Current Liabilities:Accounts Payable';
          
          if (selectedSubclass !== 'all') {
            // If a specific supplier is selected
            const selectedSupplier = suppliers.find(supp => supp._id === selectedSubclass);
            if (selectedSupplier) {
              reportParams.entityName = selectedSupplier.name || selectedSupplier.displayName;
              reportParams.entityType = 'supplier';
            }
          }
        }
      }
      
      // Fetch data from API
      const response = await fetch('/api/accounting/reports/general-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
        body: JSON.stringify(reportParams),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
      
      // Initially expand all accounts
      const initialExpanded = {};
      if (data.ledger) {
        data.ledger.forEach(account => {
          initialExpanded[account.account] = true;
        });
        setExpandedAccounts(initialExpanded);
      }
    } catch (error) {
      console.error("Error generating general ledger:", error);
      alert(`Failed to generate general ledger: ${error.message}`);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    if (!date) return "N/A";
    return formatDate(new Date(date), isNepaliCalendar);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Format colored currency for display
  const formatColoredCurrency = (amount, isCredit) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    const colorClass = isCredit ? 'text-green-600' : 'text-red-600';
    return { formattedAmount, colorClass };
  };

  // Filter accounts based on type and search query
  const filteredAccounts = reportData?.ledger?.filter(account => {
    // Filter by account type
    const typeMatch = selectedAccount === "all" || 
      (selectedAccount === "assets" && account.account.toLowerCase().startsWith("assets")) ||
      (selectedAccount === "liabilities" && account.account.toLowerCase().startsWith("liabilities")) ||
      (selectedAccount === "equity" && account.account.toLowerCase().startsWith("equity")) ||
      (selectedAccount === "revenue" && account.account.toLowerCase().startsWith("income")) ||
      (selectedAccount === "expenses" && account.account.toLowerCase().startsWith("expenses"));
    
    // Filter by search query
    const searchMatch = !searchQuery || 
      account.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.transactions.some(tx => 
        (tx.memo && tx.memo.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    
    return typeMatch && searchMatch;
  }) || [];

  // Generate report on mount or when parameters change
  useEffect(() => {
    if (currentOrganization && currentOrganization._id) {
      generateReport();
    }
  }, [startDate, endDate, selectedAccount, selectedClass, selectedSubclass, currentOrganization]);

  // Add this helper function
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle class change
  const handleClassChange = (value) => {
    setSelectedClass(value);
    
    // Show toast notification
    if (value !== 'all') {
      const className = accountClasses.find(c => c.id === value)?.name || value;
      toast({
        title: "Filter Applied",
        description: `Filtering ledger by ${className}`,
      });
    }
  };

  // Handle subclass change
  const handleSubclassChange = (value) => {
    setSelectedSubclass(value);
    
    // Show toast notification
    if (value !== 'all' && selectedClass !== 'all') {
      const className = accountClasses.find(c => c.id === selectedClass)?.name || selectedClass;
      const subclassName = subclassOptions.find(s => s.id === value)?.name || value;
      toast({
        title: "Filter Applied",
        description: `Filtering ledger by ${className} > ${subclassName}`,
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedAccount("all");
    setSelectedClass("all");
    setSelectedSubclass("all");
    // Reset dates to default values
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1)); // First day of current month
    setEndDate(now);
    setSelectedPeriod("month");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">General Ledger</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/accounting/reports")}
        >
          Back to Reports
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Select the period and account type for the general ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Period Type</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Account Type</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Account Type" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </div>
          </div>

          {/* New filter section for Class and Subclass */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Class</label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {accountClasses.map(acClass => (
                    <SelectItem key={acClass.id} value={acClass.id}>{acClass.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass !== 'all' && selectedClass !== 'assets' && 
             selectedClass !== 'liabilities' && selectedClass !== 'income' && 
             selectedClass !== 'expenses' && selectedClass !== 'others' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Subclass</label>
                <Select value={selectedSubclass} onValueChange={handleSubclassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subclass" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {subclassOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPeriod === "custom" && (
              <>
                <div>
                  <ConditionalDatePicker 
                    id="startDate"
                    name="startDate"
                    label="Start Date"
                    value={startDate ? formatDateForInput(startDate) : ""}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <ConditionalDatePicker 
                    id="endDate"
                    name="endDate"
                    label="End Date"
                    value={endDate ? formatDateForInput(endDate) : ""}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Clear filters button */}
          {(selectedAccount !== "all" || selectedClass !== "all" || selectedSubclass !== "all") && (
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <span>Clear All Filters</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">General Ledger</h2>
              <p className="text-sm text-gray-500">
                Period: {formatDisplayDate(new Date(reportData.period.startDate))} to {formatDisplayDate(new Date(reportData.period.endDate))}
              </p>
              {selectedClass !== 'all' && (
                <p className="text-sm text-blue-600">
                  Filtered by: {accountClasses.find(c => c.id === selectedClass)?.name}
                  {selectedSubclass !== 'all' && subclassOptions.length > 0 && (
                    <> &gt; {subclassOptions.find(s => s.id === selectedSubclass)?.name}</>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts or transactions..." 
              className="pl-10"
            />
          </div>

          {/* Flat transaction table */}
          {(!reportData.transactions || reportData.transactions.length === 0) ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">No transactions found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/30">
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Date</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Account</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Description</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-600">Reference</th>
                      <th className="py-2 px-4 text-right font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions
                      .filter(tx => {
                        // Filter by search query
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          (tx.account && tx.account.toLowerCase().includes(q)) ||
                          (tx.memo && tx.memo.toLowerCase().includes(q)) ||
                          (tx.journalId && tx.journalId.toLowerCase().includes(q))
                        );
                      })
                      .map((tx, idx) => {
                        // Remove prefix from account (show only last part after colon)
                        const accountName = tx.account ? tx.account.split(':').pop() : 'N/A';
                        // Show voucher number with prefix if available, else N/A
                        const reference = tx.voucherNumber || tx.journalId || 'N/A';
                        // Color: green for credit, red for debit
                        const amountColor = tx.credit ? 'text-green-600' : (tx.debit ? 'text-red-600' : '');
                        return (
                          <tr key={tx.id || idx} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{formatDisplayDate(tx.date)}</td>
                            <td className="py-2 px-4">{accountName}</td>
                            <td className="py-2 px-4">{tx.memo || 'N/A'}</td>
                            <td className="py-2 px-4">{reference}</td>
                            <td className={`py-2 px-4 text-right ${amountColor}`}>{formatCurrency(tx.amount)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 
