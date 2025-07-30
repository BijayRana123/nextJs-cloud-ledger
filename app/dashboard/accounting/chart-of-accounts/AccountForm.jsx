"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "@/components/ui/use-toast";
import { debounce } from 'lodash';

// This is the reusable form component, extracted from the old modal.
export default function AccountForm({ account, parentAccount }) {
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [isNameUnique, setIsNameUnique] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const isEditing = !!account?._id;

  // Debounced validation function
  const validateName = useCallback(
    debounce(async (name, parentCode, editingId) => {
      if (!name || (isEditing && name === account?.name)) {
        setIsNameUnique(true);
        setIsValidating(false);
        return;
      }
      setIsValidating(true);
      try {
        const response = await fetch('/api/accounting/chart-of-accounts/validate-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parentCode, editingId }),
        });
        const result = await response.json();
        setIsNameUnique(result.isUnique);
      } catch (error) {
        setIsNameUnique(false);
      } finally {
        setIsValidating(false);
      }
    }, 500),
    [isEditing, account?.name]
  );

  useEffect(() => {
    const initialData = isEditing
      ? { ...account }
      : {
          name: '',
          code: '',
          type: '',
          subtype: '',
          parent: parentAccount?.code || null,
          description: ''
        };
    setFormData(initialData);
  }, [account, parentAccount, isEditing]);

  const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
  ];

  const subtypes = {
    asset: ['current', 'fixed', 'intangible', 'other_asset'],
    liability: ['current_liability', 'long_term_liability'],
    equity: ['capital', 'drawings', 'retained_earnings'],
    revenue: ['operating_revenue', 'other_revenue'],
    expense: ['operating_expense', 'other_expense']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (name === 'name') {
            validateName(value, newData.parent, newData._id);
        }
        return newData;
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'type' && { subtype: '' }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isNameUnique) return;

    try {
      const url = isEditing
        ? `/api/accounting/chart-of-accounts/${account._id}`
        : '/api/accounting/chart-of-accounts';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save account');
      }

      toast({ title: "Success", description: `Account ${isEditing ? 'updated' : 'created'} successfully.` });
      router.push('/dashboard/accounting/chart-of-accounts');

    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const parentDisplayName = parentAccount?.path || 'None (Top-Level)';

  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>{isEditing ? `Edit Account: ${account.name}` : 'Create New Account'}</CardTitle>
            <CardDescription>
                {parentAccount ? `Adding a sub-account under ${parentAccount.path}` : (isEditing ? 'Update the details of this account.' : 'Create a new top-level account.')}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parent" className="text-right">Parent</Label>
                    <Input id="parent" value={parentDisplayName} disabled className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <div className="col-span-3">
                        <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full" required />
                        {isValidating && <p className="text-xs text-gray-500 mt-1">Checking name...</p>}
                        {!isValidating && !isNameUnique && <p className="text-xs text-red-500 mt-1">This name would create a duplicate account path.</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">Code</Label>
                    <Input id="code" name="code" value={formData.code || ''} onChange={handleChange} className="col-span-3" required disabled={isEditing} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select name="type" onValueChange={(value) => handleSelectChange('type', value)} value={formData.type} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                            {accountTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {formData.type && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subtype" className="text-right">Sub-Type</Label>
                        <Select name="subtype" onValueChange={(value) => handleSelectChange('subtype', value)} value={formData.subtype} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select sub-type" />
                            </SelectTrigger>
                            <SelectContent>
                                {subtypes[formData.type].map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} className="col-span-3" />
                </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={!isNameUnique || isValidating}>
                        {isValidating ? 'Validating...' : (isEditing ? 'Save Changes' : 'Create Account')}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
} 
