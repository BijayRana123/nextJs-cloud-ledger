import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, ExternalLink, Calendar, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils/dateUtils";

const AccountDrillDown = ({ account, organizationId, startDate, endDate, formatCurrency, isNepaliCalendar, nepaliLanguage }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAccountTransactions = async () => {
    if (!organizationId || !account.accountPath) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/accounting/ledger/account-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          accountPath: account.accountPath,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to fetch account transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccountTransactions();
    }
  }, [isOpen, organizationId, account.accountPath, startDate, endDate]);

  const formatDisplayDate = (date) => {
    if (!date) return "N/A";
    return formatDate(new Date(date), isNepaliCalendar, nepaliLanguage);
  };

  const getTransactionType = (transaction) => {
    if (transaction.debit) return 'Debit';
    if (transaction.credit) return 'Credit';
    return 'Unknown';
  };

  const getTransactionTypeColor = (transaction) => {
    if (transaction.debit) return 'bg-red-100 text-red-800';
    if (transaction.credit) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 font-normal hover:underline">
          <Eye className="h-3 w-3 mr-1" />
          {account.accountName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {account.accountName} - Transaction Details
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Period: {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Account Code</p>
                  <p className="font-semibold">{account.accountCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <Badge variant="outline">{account.accountType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Period Amount</p>
                  <p className="font-semibold">{formatCurrency(account.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="font-semibold">{account.transactionCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading transactions...</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Description</th>
                        <th className="py-3 px-4 text-left">Reference</th>
                        <th className="py-3 px-4 text-center">Type</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={transaction._id || index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDisplayDate(transaction.datetime)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-xs truncate" title={transaction.memo || transaction.description}>
                              {transaction.memo || transaction.description || 'No description'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {transaction.reference || transaction.voucherNumber || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant="outline" 
                              className={getTransactionTypeColor(transaction)}
                            >
                              {getTransactionType(transaction)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {transaction.journalId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Navigate to journal entry
                                  window.open(`/dashboard/accounting/journal-entries/${transaction.journalId}`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions found for this account in the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="font-semibold">{transactions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Debits</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(transactions.filter(t => t.debit).reduce((sum, t) => sum + t.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Credits</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(transactions.filter(t => t.credit).reduce((sum, t) => sum + t.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className={`font-semibold ${account.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDrillDown;