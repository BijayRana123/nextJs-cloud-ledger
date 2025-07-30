"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useOrganization } from '@/lib/context/OrganizationContext';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LedgerPage() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [ledgers, setLedgers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      try {
        const [ledgerRes, groupRes] = await Promise.all([
          fetch(`/api/accounting/ledgers${groupFilter ? `?group=${groupFilter}` : ""}`, {
            headers: { 'x-organization-id': currentOrganization._id },
          }),
          fetch(`/api/accounting/ledger-groups`, {
            headers: { 'x-organization-id': currentOrganization._id },
          })
        ]);
        const ledgerData = await ledgerRes.json();
        const groupData = await groupRes.json();
        if (ledgerRes.ok && groupRes.ok) {
          setLedgers(ledgerData.ledgers);
          setGroups(groupData.groups);
        } else {
          setError(ledgerData.error || groupData.error || "Failed to fetch data");
        }
      } catch (e) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentOrganization, groupFilter]);

  const filteredLedgers = ledgers.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.description && l.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ledgers</h1>
        <Button asChild>
          <Link href="/dashboard/accounting/ledger/new">Add Ledger</Link>
        </Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by name or description"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          className="border rounded px-2 py-2"
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map(g => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
      </div>
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="px-4 py-2 border">Name</TableHead>
                  <TableHead className="px-4 py-2 border">Group</TableHead>
                  <TableHead className="px-4 py-2 border">Description</TableHead>
                  <TableHead className="px-4 py-2 border">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedgers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">No ledgers found.</TableCell></TableRow>
                ) : (
                  filteredLedgers.map(l => {
                    let displayName = l.name;
                    let availableDisplay = typeof l.balance === 'number' ? l.balance.toFixed(2) : '0.00';
                    if (l.group?.name && l.group.name.toLowerCase().includes('inventory')) {
                      if (l.itemName) displayName = l.itemName;
                      if (l.availableStock !== null && l.availableStock !== undefined) {
                        availableDisplay = l.availableStock;
                      }
                    }
                    return (
                      <TableRow
                        key={l._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/accounting/ledger/${l._id}`)}
                      >
                        <TableCell className="px-4 py-2 border">{displayName}</TableCell>
                        <TableCell className="px-4 py-2 border">{l.group?.name || ""}</TableCell>
                        <TableCell className="px-4 py-2 border">{l.description}</TableCell>
                        <TableCell className="px-4 py-2 border">{availableDisplay}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
