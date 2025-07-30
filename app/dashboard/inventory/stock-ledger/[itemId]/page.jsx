"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from '@/lib/context/OrganizationContext';
import { Badge } from "@/components/ui/badge";

export default function StockLedgerPage() {
  const { itemId } = useParams();
  const { currentOrganization } = useOrganization();
  const [item, setItem] = useState(null);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    openingStock: 0,
    totalIn: 0,
    totalOut: 0,
    currentStock: 0
  });

  useEffect(() => {
    const fetchStockLedger = async () => {
      if (!itemId || !currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/inventory/stock-ledger/${itemId}`, {
          headers: { 'x-organization-id': currentOrganization._id },
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch stock ledger');
        
        setItem(data.item);
        setStockMovements(data.movements);
        setSummary(data.summary);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockLedger();
  }, [itemId, currentOrganization]);

  const getTransactionTypeBadge = (type) => {
    const variants = {
      'Opening Stock': 'bg-purple-100 text-purple-800',
      'Sales': 'bg-red-100 text-red-800',
      'Purchase': 'bg-green-100 text-green-800',
      'Sales Return': 'bg-blue-100 text-blue-800',
      'Purchase Return': 'bg-yellow-100 text-yellow-800',
      'Stock Adjustment': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`${variants[type] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {item ? `${item.name} - Stock Ledger` : 'Stock Ledger'}
              </h1>
              {item && (
                <div className="text-sm text-gray-600 mt-2">
                  <span className="mr-4">Code: {item.code || 'N/A'}</span>
                  <span className="mr-4">Category: {item.categoryLabel || 'N/A'}</span>
                  <span>Unit: {item.primaryUnitLabel || 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Current Stock</div>
              <div className="text-2xl font-bold text-blue-600">{summary.currentStock}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Opening Stock</div>
                    <div className="text-xl font-semibold text-purple-600">{summary.openingStock}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Stock In</div>
                    <div className="text-xl font-semibold text-green-600">+{summary.totalIn}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Stock Out</div>
                    <div className="text-xl font-semibold text-red-600">-{summary.totalOut}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Current Stock</div>
                    <div className="text-xl font-semibold text-blue-600">{summary.currentStock}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Movements Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty In</TableHead>
                      <TableHead className="text-right">Qty Out</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Warehouse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No stock movements found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockMovements.map((movement, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell>
                            {new Date(movement.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(movement.transactionType)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.reference}
                          </TableCell>
                          <TableCell>{movement.description}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {movement.quantityIn > 0 ? `+${movement.quantityIn}` : ''}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {movement.quantityOut > 0 ? `-${movement.quantityOut}` : ''}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {movement.balance}
                          </TableCell>
                          <TableCell>{movement.warehouse}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}