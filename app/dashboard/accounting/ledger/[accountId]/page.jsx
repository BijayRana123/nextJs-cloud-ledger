"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCalendar } from '@/lib/context/CalendarContext';
import { formatDate as formatDateUtil } from '@/lib/utils/dateUtils';
import { toast } from '@/components/ui/use-toast';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function AccountLedgerPage() {
    const router = useRouter();
    const params = useParams();
    const { accountId } = params;
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isNepaliCalendar } = useCalendar();

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return formatDateUtil(new Date(dateString), isNepaliCalendar);
    };

    useEffect(() => {
        if (accountId) {
            const fetchLedgerData = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/accounting/ledger/${accountId}`);
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to fetch ledger data');
                    }
                    setLedgerData(result.data);
                } catch (err) {
                    toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchLedgerData();
        }
    }, [accountId]);

    if (loading) {
        return <div className="container mx-auto py-6">Loading ledger...</div>;
    }

    if (!ledgerData) {
        return <div className="container mx-auto py-6">Could not load ledger data.</div>;
    }

    const { account, openingBalance, transactions, closingBalance } = ledgerData;

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{account.name} Ledger</h1>
                        <p className="text-sm text-gray-500">
                            {account.path} &bull; Code: {account.code}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Statement</CardTitle>
                    {/* Add date range filter here later */}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="font-semibold bg-gray-50">
                                <TableCell colSpan={5}>Opening Balance</TableCell>
                                <TableCell className="text-right">{formatCurrency(openingBalance)}</TableCell>
                            </TableRow>
                            {transactions.map((tx) => (
                                <TableRow key={tx._id}>
                                    <TableCell>{formatDate(tx.date)}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell>{tx.reference}</TableCell>
                                    <TableCell className="text-right">{tx.debit ? formatCurrency(tx.debit) : '-'}</TableCell>
                                    <TableCell className="text-right">{tx.credit ? formatCurrency(tx.credit) : '-'}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(tx.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-semibold bg-gray-50">
                                <TableCell colSpan={5}>Closing Balance</TableCell>
                                <TableCell className="text-right">{formatCurrency(closingBalance)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
} 