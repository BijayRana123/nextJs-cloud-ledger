"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { RefreshCw, Play, AlertCircle } from "lucide-react";

export default function AccountingDiagnosticsPage() {
  const router = useRouter();
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const loadDiagnostics = async (createTest = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = createTest 
        ? '/api/accounting/diagnostics?createTest=true' 
        : '/api/accounting/diagnostics';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      setDiagnosticData(data);
      
      if (createTest && data.testTransaction) {
        setTestResult(data.testTransaction);
      }
    } catch (err) {
      console.error("Error loading diagnostic data:", err);
      setError(err.message || "Failed to load diagnostic data");
    } finally {
      setIsLoading(false);
    }
  };

  const createTestTransaction = async () => {
    await loadDiagnostics(true);
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatColoredCurrency = (amount, isCredit) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    const colorClass = isCredit ? 'text-green-600' : 'text-red-600';
    return { formattedAmount, colorClass };
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounting System Diagnostics</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/accounting")}
          >
            Back to Accounting
          </Button>
          <Button 
            onClick={() => loadDiagnostics()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card className={`mb-6 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardHeader>
            <CardTitle className={testResult.success ? 'text-green-700' : 'text-red-700'}>
              Test Transaction Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="text-green-700">
                <p>Successfully created test transaction at {new Date(testResult.timestamp).toLocaleString()}</p>
                <p>Journal ID: {testResult.journalId}</p>
              </div>
            ) : (
              <div className="text-red-700">
                <p>Failed to create test transaction: {testResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Tests</CardTitle>
          <CardDescription>Run tests to verify the accounting system is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <p className="text-amber-800">Check your empty reports? Create a test transaction to verify the system.</p>
              </div>
              <Button 
                onClick={createTestTransaction} 
                disabled={isLoading}
                className="w-full lg:w-auto bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Create Test Transaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {diagnosticData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>Information about the MongoDB connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600">{diagnosticData.connectionStatus}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Database Name:</span>
                  <span>{diagnosticData.databaseName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record Counts</CardTitle>
              <CardDescription>Number of records in the accounting system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Transactions:</span>
                  <span>{diagnosticData.counts.transactions}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Journal Entries:</span>
                  <span>{diagnosticData.counts.journals}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 5 transactions recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {diagnosticData.recentTransactions.length === 0 ? (
                <p className="text-yellow-700 bg-yellow-50 p-3 rounded">
                  No transactions found in the database.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Account</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Memo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosticData.recentTransactions.map((tx, index) => (
                        <tr key={tx._id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="px-4 py-2">
                            {new Date(tx.datetime).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            {tx.accounts}
                          </td>
                          <td className="px-4 py-2">
                            {tx.debit ? "Debit" : "Credit"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className={tx.debit ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {tx.memo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>Current balances of major accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(diagnosticData.accountBalances).length === 0 ? (
                <p className="text-yellow-700 bg-yellow-50 p-3 rounded">
                  No account balances found in the database.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(diagnosticData.accountBalances).map(([prefix, accounts]) => (
                    <div key={prefix}>
                      <h3 className="text-lg font-semibold mb-2">{prefix}</h3>
                      <table className="w-full mb-4">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Account</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => {
                            // Determine balance color based on account type and amount
                            let colorClass = '';
                            // For income and liability accounts, credit (negative in our calculation) is normal
                            if (prefix.startsWith('Income') || prefix.startsWith('Liabilities')) {
                              colorClass = account.amount < 0 ? 'text-green-600' : 'text-red-600';
                            } else {
                              // For assets and expenses, debit (positive in our calculation) is normal
                              colorClass = account.amount > 0 ? 'text-green-600' : 'text-red-600';
                            }
                            
                            return (
                              <tr key={account._id}>
                                <td className="px-4 py-2">{account._id}</td>
                                <td className="px-4 py-2 text-right">
                                  <span className={colorClass}>
                                    {formatCurrency(account.amount)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!diagnosticData && !error && (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <p className="ml-2 text-gray-500">Loading diagnostic data...</p>
        </div>
      )}
    </div>
  );
} 
