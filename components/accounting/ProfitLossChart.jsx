import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProfitLossChart = ({ reportData, formatCurrency }) => {
  const data = reportData.currentPeriod || reportData;
  
  // Calculate percentages for visual representation
  const totalAmount = data.totals.totalRevenue + data.totals.totalExpenses;
  const revenuePercentage = totalAmount > 0 ? (data.totals.totalRevenue / totalAmount) * 100 : 0;
  const expensePercentage = totalAmount > 0 ? (data.totals.totalExpenses / totalAmount) * 100 : 0;

  // Get top 5 revenue and expense accounts for detailed view
  const topRevenues = [...(data.revenues || [])].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const topExpenses = [...(data.expenses || [])].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Revenue vs Expenses Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Revenue Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Total Revenue</span>
                <span className="text-sm font-semibold">{formatCurrency(data.totals.totalRevenue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(revenuePercentage, 5)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {revenuePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-700">Total Expenses</span>
                <span className="text-sm font-semibold">{formatCurrency(data.totals.totalExpenses)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(expensePercentage, 5)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {expensePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Net Income</span>
                <span className={`text-sm font-bold ${data.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.totals.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Revenue Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Top Revenue Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRevenues.map((account, index) => {
              const percentage = data.totals.totalRevenue > 0 ? (account.amount / data.totals.totalRevenue) * 100 : 0;
              return (
                <div key={account.accountId || index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate">{account.accountName}</span>
                    <span className="text-sm">{formatCurrency(account.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% of total revenue
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topExpenses.map((account, index) => {
              const percentage = data.totals.totalRevenue > 0 ? (account.amount / data.totals.totalRevenue) * 100 : 0;
              return (
                <div key={account.accountId || index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate">{account.accountName}</span>
                    <span className="text-sm">{formatCurrency(account.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% of total revenue
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profit Margin Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${data.totals.netIncomeMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.totals.netIncomeMargin?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Net Profit Margin</div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${data.totals.netIncomeMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ 
                  width: `${Math.min(Math.abs(data.totals.netIncomeMargin || 0), 100)}%`,
                  minWidth: '2%'
                }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-red-600">Poor</div>
                <div className="text-xs text-gray-500">&lt; 5%</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-600">Good</div>
                <div className="text-xs text-gray-500">5% - 15%</div>
              </div>
              <div>
                <div className="font-semibold text-green-600">Excellent</div>
                <div className="text-xs text-gray-500">&gt; 15%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossChart;