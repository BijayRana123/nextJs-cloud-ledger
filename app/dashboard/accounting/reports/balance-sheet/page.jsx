"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConditionalDatePicker } from "@/app/components/ConditionalDatePicker";
import { useCalendar } from "@/lib/context/CalendarContext";
import { formatDate, formatDateForInput } from "@/lib/utils/dateUtils";
import { Printer, Download, RefreshCw } from "lucide-react";

export default function BalanceSheetPage() {
  const router = useRouter();
  const { isNepaliCalendar, nepaliLanguage } = useCalendar();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date());

  // Generate balance sheet report
  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from API
      const response = await fetch('/api/accounting/reports/balance-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asOfDate: asOfDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error generating balance sheet:", error);
      // Notify user of error instead of using mock data
      alert(`Failed to generate balance sheet: ${error.message}`);
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

  // Generate report on mount or when date changes
  useEffect(() => {
    generateReport();
  }, [asOfDate]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Balance Sheet</h1>
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
          <CardDescription>Select the date for which you want to view the balance sheet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ConditionalDatePicker 
                id="asOfDate"
                name="asOfDate"
                label="As of Date"
                value={asOfDate ? formatDateForInput(asOfDate, isNepaliCalendar, nepaliLanguage) : ""}
                onChange={(e) => setAsOfDate(new Date(e.target.value))}
                className="w-full"
              />
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
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Balance Sheet</h2>
              <p className="text-sm text-gray-500">
                As of: {formatDisplayDate(new Date(reportData.asOfDate))}
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

          {/* Assets Section */}
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">Assets</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  <tr className="bg-blue-50/50 font-medium">
                    <td className="py-2 px-4" colSpan={2}>Current Assets</td>
                  </tr>
                  {reportData.assets.currentAssets.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/30 font-medium">
                    <td className="py-2 px-4">Total Current Assets</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalCurrentAssets)}</td>
                  </tr>
                  
                  <tr className="bg-blue-50/50 font-medium">
                    <td className="py-2 px-4" colSpan={2}>Fixed Assets</td>
                  </tr>
                  {reportData.assets.fixedAssets.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/30 font-medium">
                    <td className="py-2 px-4">Total Fixed Assets</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalFixedAssets)}</td>
                  </tr>
                  
                  <tr className="bg-blue-100 font-bold">
                    <td className="py-3 px-4">Total Assets</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(reportData.totals.totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Liabilities and Equity Section */}
          <Card>
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-800">Liabilities and Equity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <tbody>
                  <tr className="bg-amber-50/50 font-medium">
                    <td className="py-2 px-4" colSpan={2}>Current Liabilities</td>
                  </tr>
                  {reportData.liabilities.currentLiabilities.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/30 font-medium">
                    <td className="py-2 px-4">Total Current Liabilities</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalCurrentLiabilities)}</td>
                  </tr>
                  
                  <tr className="bg-amber-50/50 font-medium">
                    <td className="py-2 px-4" colSpan={2}>Long Term Liabilities</td>
                  </tr>
                  {reportData.liabilities.longTermLiabilities.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/30 font-medium">
                    <td className="py-2 px-4">Total Long Term Liabilities</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalLongTermLiabilities)}</td>
                  </tr>
                  
                  <tr className="bg-amber-100 font-medium">
                    <td className="py-2 px-4">Total Liabilities</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalLiabilities)}</td>
                  </tr>
                  
                  <tr className="bg-amber-50/50 font-medium">
                    <td className="py-2 px-4" colSpan={2}>Equity</td>
                  </tr>
                  {reportData.equity.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 pl-8">{item.account}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50/30 font-medium">
                    <td className="py-2 px-4">Total Equity</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(reportData.totals.totalEquity)}</td>
                  </tr>
                  
                  <tr className="bg-amber-100 font-bold">
                    <td className="py-3 px-4">Total Liabilities and Equity</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(reportData.totals.totalLiabilitiesAndEquity)}</td>
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
