"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function LedgerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInventoryItem, setIsInventoryItem] = useState(false);
  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    const fetchLedgerAndTransactions = async () => {
      if (!id || !currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch the ledger and ChartOfAccount
        const ledgerRes = await fetch(`/api/accounting/ledgers/${id}`, {
          headers: { 'x-organization-id': currentOrganization._id },
        });
        const ledgerData = await ledgerRes.json();
        if (!ledgerRes.ok) throw new Error(ledgerData.error || 'Failed to fetch ledger');
        setLedger(ledgerData.ledger);
        
        // Try to fetch transactions using ChartOfAccount _id first
        let transactionsFetched = false;
        if (ledgerData.chartOfAccount && ledgerData.chartOfAccount._id) {
          try {
            const txRes = await fetch(`/api/accounting/ledger/${ledgerData.chartOfAccount._id}`, {
              headers: { 'x-organization-id': currentOrganization._id },
            });
            const txData = await txRes.json();
            
            if (txRes.ok && txData.success !== false) {
              // Check if this is an inventory item
              if (txData.data?.isInventoryItem) {
                setIsInventoryItem(true);
                setStockData(txData.data);
                setTransactions(txData.data?.transactions || []);
              } else {
                setIsInventoryItem(false);
                setTransactions(txData.data?.transactions || []);
              }
              transactionsFetched = true;
            }
          } catch (txError) {
            console.warn('Failed to fetch transactions using ChartOfAccount ID:', txError);
          }
        }
        
        // If transactions weren't fetched using ChartOfAccount, try using the ledger ID directly
        if (!transactionsFetched) {
          try {
            const txRes = await fetch(`/api/accounting/ledger/${id}`, {
              headers: { 'x-organization-id': currentOrganization._id },
            });
            const txData = await txRes.json();
            
            if (txRes.ok && txData.success !== false) {
              // Check if this is an inventory item
              if (txData.data?.isInventoryItem) {
                setIsInventoryItem(true);
                setStockData(txData.data);
                setTransactions(txData.data?.transactions || []);
              } else {
                setIsInventoryItem(false);
                setTransactions(txData.data?.transactions || []);
              }
              transactionsFetched = true;
            }
          } catch (txError) {
            console.warn('Failed to fetch transactions using ledger ID:', txError);
          }
        }
        
        // If still no transactions, set empty array
        if (!transactionsFetched) {
          setTransactions([]);
        }
        
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLedgerAndTransactions();
  }, [id, currentOrganization]);

  const handleRowClick = (row) => {
    if (!row.referenceId && !row.meta && !row.journalId) return;
    
    // Navigate based on the transaction metadata
    if (row.meta && Object.keys(row.meta).length > 0) {
      if (row.meta.purchaseVoucherId) {
        router.push(`/dashboard/purchase/purchase-bills/${row.meta.purchaseVoucherId}`);
      } else if (row.meta.salesVoucherId) {
        router.push(`/dashboard/sales/sales-vouchers/${row.meta.salesVoucherId}`);
      } else if (row.meta.purchaseReturnId) {
        router.push(`/dashboard/purchase/purchase-return-vouchers/${row.meta.purchaseReturnId}`);
      } else if (row.meta.salesReturnId) {
        router.push(`/dashboard/sales/sales-return-vouchers/${row.meta.salesReturnId}`);
      } else if (row.meta.paymentVoucherId) {
        router.push(`/dashboard/accounting/vouchers/payment/${row.meta.paymentVoucherId}`);
      } else if (row.meta.receiptVoucherId) {
        router.push(`/dashboard/accounting/vouchers/receipt/${row.meta.receiptVoucherId}`);
      } else if (row.meta.expenseVoucherId) {
        router.push(`/dashboard/accounting/vouchers/expense/${row.meta.expenseVoucherId}`);
      } else if (row.meta.incomeVoucherId) {
        router.push(`/dashboard/accounting/vouchers/income/${row.meta.incomeVoucherId}`);
      } else {
        // If we have meta but no specific voucher ID, try to navigate to journal entry
        if (row.journalId) {
          router.push(`/dashboard/accounting/journal-entries/${row.journalId}`);
        }
      }
    } else if (row.journalId) {
      // Navigate to journal entry if we have a journal ID
      router.push(`/dashboard/accounting/journal-entries/${row.journalId}`);
    } else if (row.referenceId) {
      // Create a general transaction detail page
      router.push(`/dashboard/accounting/transactions/${row.referenceId}`);
    }
  };

  // Calculate running balance for regular accounts or stock for inventory items
  let runningBalance = ledger?.openingBalance || 0;
  const rows = [];
  
  if (isInventoryItem && transactions && transactions.length > 0) {
    // For inventory items, show stock movements
    transactions.forEach(tx => {
      rows.push({
        date: tx.date ? new Date(tx.date).toLocaleDateString() : '',
        reference: tx.reference || '',
        description: tx.description || '',
        quantityIn: tx.quantityIn || '',
        quantityOut: tx.quantityOut || '',
        balance: tx.balance || 0,
        warehouse: tx.warehouse || '',
      });
    });
  } else if (transactions && transactions.length > 0) {
    // For regular accounts, show monetary transactions
    transactions.forEach(tx => {
      const debit = tx.debit ? tx.amount : 0;
      const credit = tx.credit ? tx.amount : 0;
      runningBalance += debit - credit;
      rows.push({
        date: tx.datetime ? new Date(tx.datetime).toLocaleDateString() : '',
        reference: tx.reference || '',
        description: tx.memo || tx.description || '',
        debit: debit ? debit.toFixed(2) : '',
        credit: credit ? credit.toFixed(2) : '',
        balance: runningBalance.toFixed(2),
        meta: tx.meta || {},
        referenceId: tx._id,
        journalId: tx.journalId,
      });
    });
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {ledger ? `${ledger.name} Ledger` : 'Ledger'}
            {isInventoryItem && stockData?.account?.itemDetails && (
              <div className="text-sm text-gray-600 mt-1">
                Item Code: {stockData.account.itemDetails.code || 'N/A'} | 
                Opening Stock: {stockData.openingStock || 0} | 
                Current Stock: {stockData.closingStock || 0}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    {isInventoryItem ? (
                      <>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead className="text-right">Qty In</TableHead>
                        <TableHead className="text-right">Qty Out</TableHead>
                        <TableHead className="text-right">Stock Balance</TableHead>
                        <TableHead>Warehouse</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      {isInventoryItem ? 'Opening Stock' : 'Opening Balance'}
                    </TableCell>
                    {isInventoryItem ? (
                      <>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-semibold">{stockData?.openingStock || 0}</TableCell>
                        <TableCell></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-semibold">{ledger?.openingBalance?.toFixed(2) || '0.00'}</TableCell>
                      </>
                    )}
                  </TableRow>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isInventoryItem ? 8 : 6} className="text-center py-4">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => {
                      const isClickable = (row.referenceId || (row.meta && Object.keys(row.meta).length > 0) || row.journalId);
                      return (
                        <TableRow 
                          key={idx}
                          className={`hover:bg-gray-50 ${isClickable ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                          onClick={() => handleRowClick(row)}
                          title={isClickable ? 'Click to view transaction details' : ''}
                        >
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.reference}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          {isInventoryItem ? (
                            <>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  row.transactionType === 'Sales' ? 'bg-red-100 text-red-800' :
                                  row.transactionType === 'Purchase' ? 'bg-green-100 text-green-800' :
                                  row.transactionType === 'Sales Return' ? 'bg-blue-100 text-blue-800' :
                                  row.transactionType === 'Purchase Return' ? 'bg-yellow-100 text-yellow-800' :
                                  row.transactionType === 'Opening Stock' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {row.transactionType}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{row.quantityIn || ''}</TableCell>
                              <TableCell className="text-right">{row.quantityOut || ''}</TableCell>
                              <TableCell className="text-right">{row.balance}</TableCell>
                              <TableCell>{row.warehouse}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-right">{row.debit}</TableCell>
                              <TableCell className="text-right">{row.credit}</TableCell>
                              <TableCell className="text-right">{row.balance}</TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}