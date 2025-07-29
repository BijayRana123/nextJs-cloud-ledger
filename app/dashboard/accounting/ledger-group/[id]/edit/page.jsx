"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from '@/lib/context/OrganizationContext';

const DEFAULT_GROUPS = [
  'Capital Account', 'Current Assets', 'Current Liabilities', 'Fixed Assets', 'Investments',
  'Loans (Liability)', 'Misc. Expenses (Asset)', 'Suspense Account', 'Branch/Divisions',
  'Reserves & Surplus', 'Secured Loans', 'Unsecured Loans', 'Bank Accounts', 'Cash-in-Hand',
  'Deposits (Asset)', 'Duties & Taxes', 'Provisions', 'Sundry Creditors', 'Sundry Debtors',
  'Sales Account', 'Purchase Account', 'Direct Expenses', 'Indirect Expenses',
  'Direct Incomes', 'Indirect Incomes'
];

export default function EditLedgerGroupPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { currentOrganization } = useOrganization();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      try {
        const [groupRes, groupsRes] = await Promise.all([
          fetch(`/api/accounting/ledger-groups/${id}`, {
            headers: { 'x-organization-id': currentOrganization._id },
          }),
          fetch(`/api/accounting/ledger-groups`, {
            headers: { 'x-organization-id': currentOrganization._id },
          })
        ]);
        const groupData = await groupRes.json();
        const groupsData = await groupsRes.json();
        if (groupRes.ok && groupsRes.ok) {
          setName(groupData.group.name);
          setDescription(groupData.group.description || "");
          setParent(groupData.group.parent || "");
          setGroups(groupsData.groups);
          setIsDefault(DEFAULT_GROUPS.includes(groupData.group.name));
        } else {
          setError(groupData.error || groupsData.error || "Failed to fetch data");
        }
      } catch (e) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, currentOrganization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization || !currentOrganization._id) {
        setError("No organization selected.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/accounting/ledger-groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": currentOrganization._id,
        },
        body: JSON.stringify({ name, description, parent: parent || null }),
      });
      if (res.ok) {
        router.push("/dashboard/accounting/ledger-group");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update group");
      }
    } catch (e) {
      setError("Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ledger group? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization || !currentOrganization._id) {
        setError("No organization selected.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/accounting/ledger-groups/${id}`, {
        method: "DELETE",
        headers: {
          "x-organization-id": currentOrganization._id,
        },
      });
      if (res.ok) {
        router.push("/dashboard/accounting/ledger-group");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete group");
      }
    } catch (e) {
      setError("Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Ledger Group</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
          <Input value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Parent Group</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={parent}
            onChange={e => setParent(e.target.value)}
            disabled={loading}
          >
            <option value="">None</option>
            {groups.filter(g => g._id !== id).map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>Update Group</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/accounting/ledger-group")}>Cancel</Button>
          {!isDefault && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 