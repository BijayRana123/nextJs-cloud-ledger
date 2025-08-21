import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const ProfitLossComparison = ({ comparisonData, formatCurrency }) => {
  const { currentPeriod, previousPeriod, comparison } = comparisonData;

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatPercentage = (percent) => {
    const abs = Math.abs(percent);
    const sign = percent > 0 ? '+' : percent < 0 ? '-' : '';
    return `${sign}${abs.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Period Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Comparison */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{formatCurrency(currentPeriod.totals.totalRevenue)}</p>
                <p className="text-sm text-gray-500">vs {formatCurrency(previousPeriod.totals.totalRevenue)}</p>
                <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(comparison.revenueChange)}`}>
                  {getTrendIcon(comparison.revenueChange)}
                  <span>{formatCurrency(Math.abs(comparison.revenueChange))}</span>
                  <span>({formatPercentage(comparison.revenueChangePercent)})</span>
                </div>
              </div>
            </div>

            {/* Expenses Comparison */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{formatCurrency(currentPeriod.totals.totalExpenses)}</p>
                <p className="text-sm text-gray-500">vs {formatCurrency(previousPeriod.totals.totalExpenses)}</p>
                <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(comparison.expenseChange)}`}>
                  {getTrendIcon(comparison.expenseChange)}
                  <span>{formatCurrency(Math.abs(comparison.expenseChange))}</span>
                  <span>({formatPercentage(comparison.expenseChangePercent)})</span>
                </div>
              </div>
            </div>

            {/* Net Income Comparison */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Net Income</h3>
              <div className="space-y-1">
                <p className={`text-lg font-semibold ${currentPeriod.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentPeriod.totals.netIncome)}
                </p>
                <p className="text-sm text-gray-500">vs {formatCurrency(previousPeriod.totals.netIncome)}</p>
                <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(comparison.netIncomeChange)}`}>
                  {getTrendIcon(comparison.netIncomeChange)}
                  <span>{formatCurrency(Math.abs(comparison.netIncomeChange))}</span>
                  <span>({formatPercentage(comparison.netIncomeChangePercent)})</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Account Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-4 text-left">Account</th>
                  <th className="py-3 px-4 text-right">Current Period</th>
                  <th className="py-3 px-4 text-right">Previous Period</th>
                  <th className="py-3 px-4 text-right">Change</th>
                  <th className="py-3 px-4 text-right">% Change</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue Accounts */}
                <tr className="bg-green-50">
                  <td colSpan="5" className="py-2 px-4 font-semibold text-green-800">REVENUE</td>
                </tr>
                {currentPeriod.revenues.map((currentAccount) => {
                  const previousAccount = previousPeriod.revenues.find(
                    acc => acc.accountId === currentAccount.accountId
                  ) || { amount: 0 };
                  const change = currentAccount.amount - previousAccount.amount;
                  const changePercent = previousAccount.amount > 0 ? 
                    (change / previousAccount.amount) * 100 : 
                    (currentAccount.amount > 0 ? 100 : 0);

                  return (
                    <tr key={currentAccount.accountId} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 pl-8">{currentAccount.accountName}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(currentAccount.amount)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(previousAccount.amount)}</td>
                      <td className={`py-2 px-4 text-right ${getTrendColor(change)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {getTrendIcon(change)}
                          {formatCurrency(Math.abs(change))}
                        </div>
                      </td>
                      <td className={`py-2 px-4 text-right text-sm ${getTrendColor(change)}`}>
                        {formatPercentage(changePercent)}
                      </td>
                    </tr>
                  );
                })}

                {/* Expense Accounts */}
                <tr className="bg-red-50">
                  <td colSpan="5" className="py-2 px-4 font-semibold text-red-800">EXPENSES</td>
                </tr>
                {currentPeriod.expenses.map((currentAccount) => {
                  const previousAccount = previousPeriod.expenses.find(
                    acc => acc.accountId === currentAccount.accountId
                  ) || { amount: 0 };
                  const change = currentAccount.amount - previousAccount.amount;
                  const changePercent = previousAccount.amount > 0 ? 
                    (change / previousAccount.amount) * 100 : 
                    (currentAccount.amount > 0 ? 100 : 0);

                  return (
                    <tr key={currentAccount.accountId} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 pl-8">{currentAccount.accountName}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(currentAccount.amount)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(previousAccount.amount)}</td>
                      <td className={`py-2 px-4 text-right ${getTrendColor(change)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {getTrendIcon(change)}
                          {formatCurrency(Math.abs(change))}
                        </div>
                      </td>
                      <td className={`py-2 px-4 text-right text-sm ${getTrendColor(change)}`}>
                        {formatPercentage(changePercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossComparison;