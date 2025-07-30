"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AccountForm from '../AccountForm';
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

function NewAccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const parentCode = searchParams.get('parent');
    const [parentAccount, setParentAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (parentCode) {
            const fetchParent = async () => {
                try {
                    // We need an API to fetch a single account by its code
                    const response = await fetch(`/api/accounting/chart-of-accounts/by-code/${parentCode}`);
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to fetch parent account');
                    }
                    setParentAccount(result.data);
                } catch (err) {
                    toast({ title: "Error", description: `Could not load parent account: ${err.message}`, variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchParent();
        } else {
            setLoading(false);
        }
    }, [parentCode]);

    if (loading) {
        return <p>Loading...</p>
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center mb-6">
                 <Button variant="outline" size="icon" className="mr-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">New Account</h1>
            </div>
            <AccountForm parentAccount={parentAccount} />
        </div>
    );
}

export default function NewAccountPageSuspenseWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewAccountPage />
        </Suspense>
    )
} 
