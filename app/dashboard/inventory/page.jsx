"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useOrganization } from '@/lib/context/OrganizationContext';
import { Eye, Package } from "lucide-react";
import Link from "next/link";

export default function InventoryDashboard() {
  const { currentOrganization } = useOrganization();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalStockValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/inventory/dashboard', {
          headers: { 'x-organization-id': currentOrganization._id },
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch inventory data');
        
        setItems(data.items);
        setSummary(data.summary);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
  }, [currentOrganization]);

  // Get current stock from the API data
  const getItemStock = (item) => {
    return item.currentStock || 0;
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Total Items</div>
                    <div className="text-2xl font-bold">{summary.totalItems}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">In Stock</div>
                    <div className="text-2xl font-bold text-green-600">{summary.inStock}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Low Stock</div>
                    <div className="text-2xl font-bold text-yellow-600">{summary.lowStock}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">Out of Stock</div>
                    <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Item Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No inventory items found. Create some products first.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const currentStock = getItemStock(item);
                        const status = getStockStatus(currentStock);
                        
                        return (
                          <TableRow key={item._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.code || 'N/A'}</TableCell>
                            <TableCell>{item.categoryLabel || 'N/A'}</TableCell>
                            <TableCell>{item.primaryUnitLabel || 'N/A'}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {currentStock}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Link href={`/dashboard/inventory/stock-ledger/${item._id}`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  View Stock Ledger
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
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
