"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, ArrowLeft, Edit, Trash, Plus } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useOrganization } from '@/lib/context/OrganizationContext';
import { Switch } from '@/components/ui/switch';



function LedgerTree({ groups, ledgers, parent = null, level = 0 }) {
  const router = useRouter();
  
  const handleLedgerClick = (ledger) => {
    // Navigate to the ledger page using the ledger ID
    router.push(`/dashboard/accounting/ledger/${ledger._id}`);
  };
  
  return (
    <ul className={level === 0 ? "" : "ml-6 border-l pl-4"}>
      {groups.filter(g => (g.parent ? g.parent.toString() : null) === (parent ? parent.toString() : null)).map(group => (
        <li key={group._id} className="mb-2">
          <div className="font-semibold text-gray-800 flex items-center gap-2" style={{ marginLeft: level * 12 }}>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{group.code || '-'}</span>
            {group.name}
          </div>
          {/* List ledgers under this group */}
          <ul>
            {ledgers.filter(l => l.group && l.group._id === group._id).map(ledger => (
              <li 
                key={ledger._id} 
                className="ml-4 text-gray-700 flex items-center gap-2 hover:text-blue-600 cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => handleLedgerClick(ledger)}
              >
                <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded">{ledger.code || '-'}</span>
                - {ledger.name}
              </li>
            ))}
          </ul>
          {/* Recursively render sub-groups */}
          <LedgerTree groups={groups} ledgers={ledgers} parent={group._id} level={level + 1} />
        </li>
      ))}
    </ul>
  );
}

function FlatAccountList({ groups, ledgers }) {
  const router = useRouter();
  
  // Build a flat list with indentation
  function buildList(parent = null, level = 0) {
    let rows = [];
    groups.filter(g => (g.parent ? g.parent.toString() : null) === (parent ? parent.toString() : null)).forEach(group => {
      rows.push({ type: 'group', group, level });
      // Ledgers under this group
      ledgers.filter(l => l.group && l.group._id === group._id).forEach(ledger => {
        rows.push({ type: 'ledger', ledger, level: level + 1 });
      });
      // Recurse for sub-groups
      rows = rows.concat(buildList(group._id, level + 1));
    });
    return rows;
  }
  
  const handleLedgerClick = (ledger) => {
    // Navigate to the ledger page using the ledger ID
    router.push(`/dashboard/accounting/ledger/${ledger._id}`);
  };
  
  const rows = buildList();
  return (
    <table className="min-w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 border text-left">Code</th>
          <th className="px-4 py-2 border text-left">Name</th>
          <th className="px-4 py-2 border text-left">Type</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr 
            key={row.type === 'group' ? row.group._id : row.ledger._id}
            className={row.type === 'ledger' ? 'hover:bg-gray-50 cursor-pointer' : ''}
            onClick={row.type === 'ledger' ? () => handleLedgerClick(row.ledger) : undefined}
          >
            <td className="px-4 py-2 border">
              <span className="font-mono text-sm">
                {row.type === 'group' ? (row.group.code || '-') : (row.ledger.code || '-')}
              </span>
            </td>
            <td className="px-4 py-2 border" style={{ paddingLeft: `${row.level * 24}px` }}>
              {row.type === 'group' ? 
                <span className="font-semibold text-gray-800">{row.group.name}</span> : 
                <span className="text-gray-700 hover:text-blue-600">{row.ledger.name}</span>
              }
            </td>
            <td className="px-4 py-2 border">{row.type === 'group' ? 'Group' : 'Ledger'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ChartOfAccountsPage() {
  const { currentOrganization } = useOrganization();
  const [groups, setGroups] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treeView, setTreeView] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization || !currentOrganization._id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/accounting/chart-of-accounts`, {
          headers: { 'x-organization-id': currentOrganization._id },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setGroups(data.groups);
          setLedgers(data.ledgers);
        } else {
          setError(data.error || 'Failed to fetch data');
        }
      } catch (e) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentOrganization]);



  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chart of Accounts</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">Tree View</span>
          <Switch checked={treeView} onCheckedChange={setTreeView} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>View your chart of accounts, grouped by ledger group. Toggle between flat and tree view. Account codes are displayed for easy reference.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading accounts...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : treeView ? (
            <LedgerTree groups={groups} ledgers={ledgers} />
          ) : (
            <FlatAccountList groups={groups} ledgers={ledgers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
