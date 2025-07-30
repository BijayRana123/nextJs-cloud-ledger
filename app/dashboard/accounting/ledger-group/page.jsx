"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { CustomTable, CustomTableBody, CustomTableCell, CustomTableHead, CustomTableHeader, CustomTableRow } from "@/components/ui/CustomTable";
import { Plus, Rocket, Search } from "lucide-react";
import { useOrganization } from '@/lib/context/OrganizationContext';

export default function LedgerGroupPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization || !currentOrganization._id) {
        setError("No organization selected.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/accounting/ledger-groups", {
        headers: { 'x-organization-id': currentOrganization._id },
      });
      const data = await res.json();
      if (res.ok) setGroups(data.groups);
      else setError(data.error || "Failed to fetch groups");
    } catch (e) {
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, [currentOrganization]);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-4">Loading ledger groups...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ledger Groups</h1>
        <Link href="/dashboard/accounting/ledger-group/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-primary-foreground shadow hover:bg-green-600 h-9 px-4 py-2">
          <Plus className="h-5 w-5 mr-2" /> Add Ledger Group
        </Link>
      </div>
      <div className="flex items-center mb-4">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <Input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      <div className="border rounded-md">
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow className="bg-gray-100">
              <CustomTableHead>Name</CustomTableHead>
              <CustomTableHead>Description</CustomTableHead>
              <CustomTableHead>Parent Group</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            {filteredGroups.map(group => (
              <CustomTableRow
                key={group._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/dashboard/accounting/ledger-group/${group._id}/edit`)}
              >
                <CustomTableCell>{group.name}</CustomTableCell>
                <CustomTableCell>{group.description || "-"}</CustomTableCell>
                <CustomTableCell>{group.parent ? (groups.find(g => g._id === group.parent)?.name || "-") : "-"}</CustomTableCell>
              </CustomTableRow>
            ))}
            {filteredGroups.length === 0 && (
              <CustomTableRow>
                <CustomTableCell colSpan={3} className="text-center py-4">
                  No ledger groups found.
                </CustomTableCell>
              </CustomTableRow>
            )}
          </CustomTableBody>
        </CustomTable>
      </div>
    </div>
  );
} 
