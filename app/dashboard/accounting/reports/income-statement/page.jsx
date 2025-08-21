"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionalDatePicker } from "@/components/ConditionalDatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "@/lib/context/CalendarContext";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { formatDate, formatDateForInput } from "@/lib/utils/dateUtils";
import { Printer, Download, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProfitLossComparison from "@/components/accounting/ProfitLossComparison";
import ProfitLossChart from "@/components/accounting/ProfitLossChart";
import AccountDrillDown from "@/components/accounting/AccountDrillDown";

export default function IncomeStatementPage() {
  const router = useRouter();
  const { isNepaliCalendar, nepaliLanguage } = useCalendar();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState(new Date());
  const [timeFrame, setTimeFrame] = useState("current");
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState(null);

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

  // Handle timeframe selection
  const handleTimeFrameChange = (value) => {
    setTimeFrame(value);
    const now = new Date();
    
    if (value === "current") {
      if (selectedPeriod === "month") {
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(now);
      } else if (selectedPeriod === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        setStartDate(new Date(now.getFullYear(), quarter * 3, 1));
        setEndDate(now);
      } else if (selectedPeriod === "year") {
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(now);
      }
    } else if (value === "previous") {
      if (selectedPeriod === "month") {
        setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth(), 0));
      } else if (selectedPeriod === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        setStartDate(new Date(now.getFullYear(), (quarter - 1) * 3, 1));
        setEndDate(new Date(now.getFullYear(), quarter * 3, 0));
      } else if (selectedPeriod === "year") {
        setStartDate(new Date(now.getFullYear() - 1, 0, 1));
        setEndDate(new Date(now.getFullYear() - 1, 11, 31));
      }
    }
  };

  // Generate income statement report
  const generateReport = async () => {
    if (!currentOrganization?._id) {
      setError("Organization not selected");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        organizationId: currentOrganization._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: 'json'
      };

      // Add comparison data if enabled
      if (showComparison) {
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
        
        requestBody.includeComparison = true;
        requestBody.previousStartDate = previousStartDate.toISOString();
        requestBody.previousEndDate = previousEndDate.toISOString();
      }

      const response = await fetch('/api/accounting/reports/income-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const result = await response.json();
      setReportData(result.data);
    } catch (error) {
      console.error("Error generating profit & loss statement:", error);
      setError(error.message);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    if (!date) return "N/A";
    return formatDate(date, isNepaliCalendar, nepaliLanguage);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Generate report when organization is loaded or dates change
  useEffect(() => {
    if (currentOrganization?._id && !orgLoading) {
      generateReport();
    }
  }, [currentOrganization?._id, startDate, endDate, showComparison, orgLoading]);

  // Export to CSV
  const exportToCSV = async () => {
    if (!currentOrganization?._id) return;

    try {
      const response = await fetch('/api/accounting/reports/income-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
        body: JSON.stringify({
          organizationId: currentOrganization._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: 'csv'
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profit-loss-statement-${startDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    }
  };

  if (orgLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading organization...</span>
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
              <p className="text-gray-600 mb-4">Please select an organization to view the profit & loss statement.</p>
              <Button onClick={() => router.push('/onboarding/select-organization')}>
                Select Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          {currentOrganization && (
            <p className="text-sm text-gray-600 mt-1">{currentOrganization.name}</p>
          )}
        </div>
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
          <CardDescription>Select the period for which you want to view the profit & loss statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {selectedPeriod !== "custom" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Time Frame</label>
                <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Time Frame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="previous">Previous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPeriod === "custom" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <ConditionalDatePicker 
                    id="startDate"
                    name="startDate"
                    value={startDate ? formatDateForInput(startDate, isNepaliCalendar, nepaliLanguage) : ""}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <ConditionalDatePicker 
                    id="endDate"
                    name="endDate"
                    value={endDate ? formatDateForInput(endDate, isNepaliCalendar, nepaliLanguage) : ""}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div className="flex items-end gap-2">
              <Button 
                onClick={generateReport} 
                disabled={isLoading}
                className="flex-1"
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

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show period comparison</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Profit & Loss Statement</h2>
              <p className="text-sm text-gray-500">
                Period: {(reportData.currentPeriod || reportData).period?.description || 
                  `${formatDisplayDate(new Date((reportData.currentPeriod || reportData).period.startDate))} to ${formatDisplayDate(new Date((reportData.currentPeriod || reportData).period.endDate))}`}
              </p>
              {(reportData.currentPeriod || reportData).summary?.isProfitable !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  {(reportData.currentPeriod || reportData).summary.isProfitable ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Profitable
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Loss
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    Net Margin: {(reportData.currentPeriod || reportData).totals.netIncomeMargin?.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Validation Warnings */}
          {(reportData.currentPeriod || reportData).validation?.warnings?.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-yellow-700 space-y-1">
                  {(reportData.currentPeriod || reportData).validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning.message}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tabbed Interface */}
          <Tabs defaultValue="statement" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="statement">Statement</TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="h-4 w-4 mr-1" />
                Charts
              </TabsTrigger>
              {reportData.comparison && (
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              )}
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            {/* Main Statement Tab */}
            <TabsContent value="statement" className="space-y-6">
              {/* Revenue Section */}
              <Card>
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800 flex items-center justify-between">
                    Revenue
                    <span className="text-sm font-normal">
                      {(reportData.currentPeriod || reportData).summary?.totalRevenueAccounts} accounts
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-2 px-4 text-left">Account</th>
                        <th className="py-2 px-4 text-right">Amount</th>
                        <th className="py-2 px-4 text-right">% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.currentPeriod || reportData).revenues?.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 pl-8">
                            <AccountDrillDown
                              account={item}
                              organizationId={currentOrganization._id}
                              startDate={startDate}
                              endDate={endDate}
                              formatCurrency={formatCurrency}
                              isNepaliCalendar={isNepaliCalendar}
                              nepaliLanguage={nepaliLanguage}
                            />
                          </td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                          <td className="py-2 px-4 text-right text-sm text-gray-600">
                            {item.percentageOfRevenue?.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-green-100 font-medium">
                        <td className="py-3 px-4">Total Revenue</td>
                        <td className="py-3 px-4 text-right">{formatCurrency((reportData.currentPeriod || reportData).totals.totalRevenue)}</td>
                        <td className="py-3 px-4 text-right">100.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Expenses Section */}
              <Card>
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-800 flex items-center justify-between">
                    Expenses
                    <span className="text-sm font-normal">
                      {(reportData.currentPeriod || reportData).summary?.totalExpenseAccounts} accounts
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-2 px-4 text-left">Account</th>
                        <th className="py-2 px-4 text-right">Amount</th>
                        <th className="py-2 px-4 text-right">% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData.currentPeriod || reportData).expenses?.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 pl-8">
                            <AccountDrillDown
                              account={item}
                              organizationId={currentOrganization._id}
                              startDate={startDate}
                              endDate={endDate}
                              formatCurrency={formatCurrency}
                              isNepaliCalendar={isNepaliCalendar}
                              nepaliLanguage={nepaliLanguage}
                            />
                          </td>
                          <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                          <td className="py-2 px-4 text-right text-sm text-gray-600">
                            {item.percentageOfRevenue?.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-red-100 font-medium">
                        <td className="py-3 px-4">Total Expenses</td>
                        <td className="py-3 px-4 text-right">{formatCurrency((reportData.currentPeriod || reportData).totals.totalExpenses)}</td>
                        <td className="py-3 px-4 text-right">
                          {(reportData.currentPeriod || reportData).totals.totalRevenue > 0 ? 
                            (((reportData.currentPeriod || reportData).totals.totalExpenses / (reportData.currentPeriod || reportData).totals.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Net Income Section */}
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <tbody>
                      <tr className={`font-bold text-lg ${(reportData.currentPeriod || reportData).totals.netIncome >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                        <td className="py-4 px-4">Net Income</td>
                        <td className="py-4 px-4 text-right">{formatCurrency((reportData.currentPeriod || reportData).totals.netIncome)}</td>
                        <td className="py-4 px-4 text-right">{(reportData.currentPeriod || reportData).totals.netIncomeMargin?.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts">
              <ProfitLossChart 
                reportData={reportData} 
                formatCurrency={formatCurrency} 
              />
            </TabsContent>

            {/* Comparison Tab */}
            {reportData.comparison && (
              <TabsContent value="comparison">
                <ProfitLossComparison 
                  comparisonData={reportData} 
                  formatCurrency={formatCurrency} 
                />
              </TabsContent>
            )}

            {/* Summary Tab */}
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Revenue Accounts</span>
                        <span className="font-semibold">{(reportData.currentPeriod || reportData).summary?.totalRevenueAccounts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Expense Accounts</span>
                        <span className="font-semibold">{(reportData.currentPeriod || reportData).summary?.totalExpenseAccounts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Net Profit Margin</span>
                        <span className={`font-semibold ${(reportData.currentPeriod || reportData).totals.netIncomeMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(reportData.currentPeriod || reportData).totals.netIncomeMargin?.toFixed(1)}%
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        {(reportData.currentPeriod || reportData).summary?.isProfitable ? (
                          <Badge className="bg-green-100 text-green-800">Profitable</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">Loss</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(reportData.currentPeriod || reportData).summary?.largestRevenueSource && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Largest Revenue Source</p>
                          <p className="font-semibold">{(reportData.currentPeriod || reportData).summary.largestRevenueSource.accountName}</p>
                          <p className="text-sm text-green-600">{formatCurrency((reportData.currentPeriod || reportData).summary.largestRevenueSource.amount)}</p>
                        </div>
                      )}
                      
                      {(reportData.currentPeriod || reportData).summary?.largestExpense && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Largest Expense</p>
                          <p className="font-semibold">{(reportData.currentPeriod || reportData).summary.largestExpense.accountName}</p>
                          <p className="text-sm text-red-600">{formatCurrency((reportData.currentPeriod || reportData).summary.largestExpense.amount)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
} 
