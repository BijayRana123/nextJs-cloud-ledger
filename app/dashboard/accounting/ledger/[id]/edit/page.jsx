"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function EditLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { currentOrganization } = useOrganization();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      try {
        console.log('Fetching ledger:', id, 'for org:', currentOrganization._id);
        const [ledgerRes, groupRes] = await Promise.all([
          fetch(`/api/accounting/ledgers/${id}`, {
            headers: { 'x-organization-id': currentOrganization._id },
          }),
          fetch(`/api/accounting/ledger-groups`, {
            headers: { 'x-organization-id': currentOrganization._id },
          })
        ]);
        const ledgerData = await ledgerRes.json();
        const groupData = await groupRes.json();
        if (ledgerRes.ok && groupRes.ok) {
          setName(ledgerData.ledger.name);
          setDescription(ledgerData.ledger.description || "");
          setGroup(ledgerData.ledger.group?._id || "");
          setOpeningBalance(ledgerData.ledger.openingBalance || 0);
          setGroups(groupData.groups);
        } else {
          console.log('Ledger API error:', ledgerData, 'Group API error:', groupData);
          setError(ledgerData.error || groupData.error || "Failed to fetch data");
        }
      } catch (e) {
        console.log('Fetch exception:', e);
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
      const res = await fetch(`/api/accounting/ledgers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": currentOrganization._id,
        },
        body: JSON.stringify({ name, description, group, openingBalance }),
      });
      if (res.ok) {
        router.push("/dashboard/accounting/ledger");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update ledger");
      }
    } catch (e) {
      setError("Failed to update ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ledger? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization || !currentOrganization._id) {
        setError("No organization selected.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/accounting/ledgers/${id}`, {
        method: "DELETE",
        headers: {
          "x-organization-id": currentOrganization._id,
        },
      });
      if (res.ok) {
        router.push("/dashboard/accounting/ledger");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete ledger");
      }
    } catch (e) {
      setError("Failed to delete ledger");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Ledger</h1>
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
          <label className="block mb-1 font-medium">Group<span className="text-red-500">*</span></label>
          <select
            className="w-full border rounded px-2 py-2"
            value={group}
            onChange={e => setGroup(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select Group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Opening Balance</label>
          <Input type="number" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} disabled={loading} />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>Update Ledger</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/accounting/ledger")}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            Delete
          </Button>
        </div>
      </form>
    </div>
  );
} 