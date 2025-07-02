"use client";

import React, { useState, useEffect } from 'react';
import AccountForm from '../../AccountForm';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function EditAccountPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [account, setAccount] = useState(null);
    const [parentAccount, setParentAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchAccountData = async () => {
                try {
                    // We need an API to fetch a single account by its ID
                    const response = await fetch(`/api/accounting/chart-of-accounts/by-id/${id}`);
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to fetch account');
                    }
                    setAccount(result.data);

                    // If there's a parent, fetch it too
                    if (result.data.parent) {
                         const parentResponse = await fetch(`/api/accounting/chart-of-accounts/by-code/${result.data.parent}`);
                         const parentResult = await parentResponse.json();
                         if(parentResult.success) {
                             setParentAccount(parentResult.data);
                         }
                    }
                } catch (err) {
                    toast({ title: "Error", description: `Could not load account data: ${err.message}`, variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchAccountData();
        }
    }, [id]);

    if (loading) {
        return <p>Loading...</p>
    }

    if (!account) {
        return <p>Account not found.</p>
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center mb-6">
                 <Button variant="outline" size="icon" className="mr-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Edit Account</h1>
            </div>
            <AccountForm account={account} parentAccount={parentAccount} />
        </div>
    );
} 