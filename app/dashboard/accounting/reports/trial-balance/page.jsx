"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, Printer, RefreshCw } from "lucide-react";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { toast } from "sonner";

export default function TrialBalancePage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTrialBalance = async () => {
    if (!currentOrganization?._id) {
      toast.error("Please select an organization first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/accounting/trial-balance?organizationId=${currentOrganization._id}&asOfDate=${asOfDate}T23:59:59.999Z`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trial balance');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTrialBalanceData(result.data);
        if (!result.data.totals.isBalanced) {
          toast.warning(`Trial Balance is out of balance by ${Math.abs(result.data.totals.difference).toFixed(2)}`);
        } else {
          toast.success("Trial Balance is balanced!");
        }
      } else {
        throw new Error(result.error || 'Failed to generate trial balance');
      }
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      toast.error(error.message || 'Failed to fetch trial balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization?._id) {
      fetchTrialBalance();
    }
  }, [currentOrganization?._id, asOfDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      asset: 'bg-green-100 text-green-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-blue-100 text-blue-800',
      revenue: 'bg-purple-100 text-purple-800',
      expense: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!trialBalanceData) return;

    // Create CSV content with organization info
    const headers = ['Account Code', 'Account Name', 'Account Type', 'Account Subtype', 'Debit Amount', 'Credit Amount'];
    const csvContent = [
      `Trial Balance Report`,
      `Organization: ${currentOrganization?.name || 'N/A'}`,
      `As of Date: ${formatDate(trialBalanceData.asOfDate)}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Status: ${trialBalanceData.totals.isBalanced ? 'Balanced' : 'Out of Balance'}`,
      '',
      headers.join(','),
      ...trialBalanceData.accounts.map(account => [
        account.accountCode,
        `"${account.accountName}"`,
        account.accountType,
        account.accountSubtype || '',
        account.debitAmount.toFixed(2),
        account.creditAmount.toFixed(2)
      ].join(',')),
      '',
      `TOTALS,,,,,`,
      `Total Debits,,,,${trialBalanceData.totals.totalDebits.toFixed(2)},`,
      `Total Credits,,,,,${trialBalanceData.totals.totalCredits.toFixed(2)}`,
      `Difference,,,,${trialBalanceData.totals.difference.toFixed(2)},`,
      '',
      `Summary:,,,,,`,
      `Total Accounts: ${trialBalanceData.summary.totalAccounts},,,,,`,
      `Accounts with Debit Balance: ${trialBalanceData.summary.accountsWithDebitBalance},,,,,`,
      `Accounts with Credit Balance: ${trialBalanceData.summary.accountsWithCreditBalance},,,,,`
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${currentOrganization?.name || 'organization'}-${asOfDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 print:py-2">
      {/* Header - Hidden in print */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-gray-600 mt-1">
            Verify that debits equal credits across all accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/accounting/reports")}
          >
            Back to Reports
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={!trialBalanceData}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={!trialBalanceData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Selection - Hidden in print */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="asOfDate" className="block text-sm font-medium mb-1">
                As of Date
              </label>
              <input
                type="date"
                id="asOfDate"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select the date to generate trial balance as of that date
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setAsOfDate(new Date().toISOString().split('T')[0])}
                disabled={loading}
                className="whitespace-nowrap"
              >
                Today
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  lastMonth.setDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate());
                  setAsOfDate(lastMonth.toISOString().split('T')[0]);
                }}
                disabled={loading}
                className="whitespace-nowrap"
              >
                Last Month End
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  const yearEnd = new Date();
                  yearEnd.setMonth(11, 31); // December 31st
                  if (yearEnd > new Date()) {
                    yearEnd.setFullYear(yearEnd.getFullYear() - 1);
                  }
                  setAsOfDate(yearEnd.toISOString().split('T')[0]);
                }}
                disabled={loading}
                className="whitespace-nowrap"
              >
                Year End
              </Button>
              <Button 
                onClick={fetchTrialBalance} 
                disabled={loading}
                className="whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Report */}
      {trialBalanceData && (
        <Card>
          <CardHeader className="print:pb-2">
            <div className="text-center">
              <CardTitle className="text-2xl print:text-xl">
                {currentOrganization?.name || 'Organization'}
              </CardTitle>
              <CardDescription className="text-lg print:text-base font-semibold">
                Trial Balance
              </CardDescription>
              <CardDescription className="print:text-sm">
                As of {formatDate(trialBalanceData.asOfDate)}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="print:px-2">
            {/* Balance Status */}
            <div className="mb-4 print:mb-2">
              <div className="flex justify-center">
                <Badge 
                  variant={trialBalanceData.totals.isBalanced ? "default" : "destructive"}
                  className="text-sm print:text-xs"
                >
                  {trialBalanceData.totals.isBalanced 
                    ? "✓ Trial Balance is Balanced" 
                    : `⚠ Out of Balance by ${formatCurrency(Math.abs(trialBalanceData.totals.difference))}`
                  }
                </Badge>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="print:text-xs">Account Code</TableHead>
                    <TableHead className="print:text-xs">Account Name</TableHead>
                    <TableHead className="print:text-xs print:hidden">Type</TableHead>
                    <TableHead className="text-right print:text-xs">Debit</TableHead>
                    <TableHead className="text-right print:text-xs">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalanceData.accounts.map((account, index) => (
                    <TableRow key={index} className="print:text-xs">
                      <TableCell className="font-mono">{account.accountCode}</TableCell>
                      <TableCell>{account.accountName}</TableCell>
                      <TableCell className="print:hidden">
                        <Badge 
                          variant="outline" 
                          className={getAccountTypeColor(account.accountType)}
                        >
                          {account.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {account.debitAmount > 0 ? formatCurrency(account.debitAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {account.creditAmount > 0 ? formatCurrency(account.creditAmount) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="border-t-2 font-bold print:text-xs">
                    <TableCell colSpan={3} className="text-right">
                      <strong>TOTALS:</strong>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <strong>{formatCurrency(trialBalanceData.totals.totalDebits)}</strong>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <strong>{formatCurrency(trialBalanceData.totals.totalCredits)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary Statistics - Hidden in print */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {trialBalanceData.summary.totalAccounts}
                    </div>
                    <div className="text-sm text-gray-600">Total Accounts</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {trialBalanceData.summary.accountsWithDebitBalance}
                    </div>
                    <div className="text-sm text-gray-600">Debit Balances</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {trialBalanceData.summary.accountsWithCreditBalance}
                    </div>
                    <div className="text-sm text-gray-600">Credit Balances</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer for print */}
            <div className="hidden print:block mt-4 text-center text-xs text-gray-500">
              Generated on {new Date().toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !trialBalanceData && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Generating trial balance...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !trialBalanceData && currentOrganization && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No trial balance data available</p>
              <Button onClick={fetchTrialBalance}>
                Generate Trial Balance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

