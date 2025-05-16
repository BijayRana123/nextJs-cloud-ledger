"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate, formatDateForInput } from "@/lib/utils/dateUtils";
import { Printer, Download, RefreshCw } from "lucide-react";

export default function IncomeStatementPage() {
  const router = useRouter();
  const { isNepaliCalendar, nepaliLanguage } = useCalendar();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState(new Date());
  const [timeFrame, setTimeFrame] = useState("current");

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
    setIsLoading(true);
    try {
      // Fetch real data from API
      const response = await fetch('/api/accounting/reports/income-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error generating income statement:", error);
      // Notify user of error instead of using mock data
      alert(`Failed to generate income statement: ${error.message}`);
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

  // Generate report on mount or when dates change
  useEffect(() => {
    generateReport();
  }, [startDate, endDate]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income Statement</h1>
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
          <CardDescription>Select the period for which you want to view the income statement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Income Statement</h2>
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

          {/* Income Statement Report */}
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  {reportData.revenues.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-100 font-medium">
                    <td className="py-2 px-4">Total Revenue</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  {reportData.expenses.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-100 font-medium">
                    <td className="py-2 px-4">Total Expenses</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  <tr className={`font-bold ${reportData.totals.netIncome >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                    <td className="py-3 px-4 text-lg">Net Income</td>
                    <td className="py-3 px-4 text-right text-lg">{formatCurrency(reportData.totals.netIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 