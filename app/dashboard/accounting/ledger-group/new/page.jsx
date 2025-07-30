"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function AddLedgerGroupPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      const res = await fetch("/api/accounting/ledger-groups", {
        headers: { 'x-organization-id': currentOrganization._id },
      });
      const data = await res.json();
      if (res.ok) setGroups(data.groups);
    };
    fetchGroups();
  }, [currentOrganization]);

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
      const res = await fetch("/api/accounting/ledger-groups", {
        method: "POST",
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
        setError(data.error || "Failed to add group");
      }
    } catch (e) {
      setError("Failed to add group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add Ledger Group</h1>
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
            {groups.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>Add Group</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/accounting/ledger-group")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
} 
