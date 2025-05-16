"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate } from "@/lib/utils/dateUtils";
import { Printer, Download, RefreshCw, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  // List of accounts for the select dropdown
  const accounts = [
    { id: "all", name: "All Accounts" },
    { id: "assets", name: "Assets" },
    { id: "liabilities", name: "Liabilities" },
    { id: "equity", name: "Equity" },
    { id: "revenue", name: "Revenue" },
    { id: "expenses", name: "Expenses" },
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

  // Generate ledger report
  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Fetch data from API
      const response = await fetch('/api/accounting/reports/general-ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          account: selectedAccount !== 'all' ? selectedAccount : null,
        }),
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
    generateReport();
  }, [startDate, endDate, selectedAccount]);

  // Add this helper function
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

          {filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">No accounts found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.account} className="mb-4">
                <CardHeader className="py-3 px-4 bg-gray-50 cursor-pointer" onClick={() => toggleAccountExpansion(account.account)}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {expandedAccounts[account.account] ? 
                        <ChevronDown className="h-5 w-5 mr-2 text-gray-500" /> : 
                        <ChevronRight className="h-5 w-5 mr-2 text-gray-500" />
                      }
                      <h3 className="text-lg font-medium">{account.account}</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedAccounts[account.account] && (
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50/30">
                          <th className="py-2 px-4 text-left font-medium text-gray-600">Date</th>
                          <th className="py-2 px-4 text-left font-medium text-gray-600">Description</th>
                          <th className="py-2 px-4 text-left font-medium text-gray-600">Reference</th>
                          <th className="py-2 px-4 text-right font-medium text-gray-600">Debit</th>
                          <th className="py-2 px-4 text-right font-medium text-gray-600">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.transactions.map((transaction, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{formatDisplayDate(transaction.date || transaction.datetime)}</td>
                            <td className="py-2 px-4">{transaction.memo || "N/A"}</td>
                            <td className="py-2 px-4">{transaction.journalId || transaction._journal || "N/A"}</td>
                            <td className="py-2 px-4 text-right">
                              {transaction.debit ? (
                                <span className="text-red-600">{formatCurrency(transaction.amount)}</span>
                              ) : ""}
                            </td>
                            <td className="py-2 px-4 text-right">
                              {transaction.credit ? (
                                <span className="text-green-600">{formatCurrency(transaction.amount)}</span>
                              ) : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
} 