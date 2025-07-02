"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, ArrowLeft, Edit, Trash, Plus } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";


// Recursive component to render account rows
function AccountRow({ account, level = 0, onAddSubAccount, onEdit, onDelete }) {
    const router = useRouter();

    const handleNavigate = () => {
        router.push(`/dashboard/accounting/ledger/${account._id}`);
    };

    return (
        <div className="flex items-center justify-between p-2 border-b hover:bg-gray-50/70 group">
            <div 
                className="flex-grow flex items-center cursor-pointer"
                onClick={handleNavigate}
            >
                <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center">
                    <span className="font-mono text-sm text-gray-500 w-24">{account.code}</span>
                    <span className="group-hover:underline">{account.name}</span>
                </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => onAddSubAccount(account)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Sub-Account
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(account)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(account)} className="text-red-500 hover:text-red-600">
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function AccountList({ accounts, onAddSubAccount, onEdit, onDelete, onSeed }) {
    if (accounts.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 mb-4">Your Chart of Accounts is empty.</p>
                <Button onClick={onSeed}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Seed Default Accounts
                </Button>
            </div>
        )
    }

    return (
        <div>
            {accounts.map(account => (
                <React.Fragment key={account.code}>
                    <AccountRow account={account} onAddSubAccount={onAddSubAccount} onEdit={onEdit} onDelete={onDelete} />
                    {account.children && account.children.length > 0 && (
                        <div className="pl-4">
                           <AccountList accounts={account.children} onAddSubAccount={onAddSubAccount} onEdit={onEdit} onDelete={onDelete} />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}


export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounting/chart-of-accounts');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch accounts');
      }
      setAccounts(result.data);
    } catch (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSeedAccounts = async () => {
    try {
        const response = await fetch('/api/accounting/seed-accounts', { method: 'POST' });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to seed accounts');
        }

        toast({ title: "Success", description: result.message });
        fetchAccounts(); // Refresh the list
    } catch (err) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (account) => {
    if (!confirm(`Are you sure you want to delete the account "${account.name}"? This cannot be undone.`)) {
        return;
    }
      
    try {
        const response = await fetch(`/api/accounting/chart-of-accounts/${account._id}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete account');
        }

        toast({ title: "Success", description: "Account deleted successfully." });
        fetchAccounts(); // Refresh the list

    } catch (err) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chart of Accounts</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/accounting')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounting
            </Button>
            <Button onClick={() => router.push('/dashboard/accounting/chart-of-accounts/new')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Account
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>View, create, and manage your accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading accounts...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <AccountList 
                accounts={accounts}
                onAddSubAccount={(parent) => router.push(`/dashboard/accounting/chart-of-accounts/new?parent=${parent.code}`)}
                onEdit={(account) => router.push(`/dashboard/accounting/chart-of-accounts/${account._id}/edit`)}
                onDelete={handleDelete}
                onSeed={handleSeedAccounts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 