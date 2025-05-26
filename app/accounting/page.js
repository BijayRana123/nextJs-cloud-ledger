'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountingPage() {
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [error, setError] = useState(null);

  // Fetch account balances
  useEffect(() => {
    async function fetchBalances() {
      try {
        const response = await fetch('/api/accounting/balances');
        const data = await response.json();
        
        if (data.success) {
          setBalances(data.balances || []);
        } else {
          setError(data.error || 'Unknown error');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBalances();
  }, []);

  // Run demo function
  const runDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounting/demo', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Refresh balances
        const balancesResponse = await fetch('/api/accounting/balances');
        const balancesData = await balancesResponse.json();
        
        if (balancesData.success) {
          setBalances(balancesData.balances || []);
          setError(null);
        }
      } else {
        setError(data.error || 'Error running demo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Accounting Dashboard</h1>
      
      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={runDemo}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Run Demo'}
        </button>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Account balances */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Account Balances</h2>
        {loading ? (
          <p>Loading account balances...</p>
        ) : balances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Account Code</th>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Path</th>
                  <th className="py-2 px-4 border-b text-left">Type</th>
                  <th className="py-2 px-4 border-b text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((account) => (
                  <tr key={account.code} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{account.code}</td>
                    <td className="py-2 px-4 border-b">{account.name}</td>
                    <td className="py-2 px-4 border-b">{account.path}</td>
                    <td className="py-2 px-4 border-b capitalize">{account.type}</td>
                    <td className="py-2 px-4 border-b text-right">
                      {typeof account.balance === 'number' 
                        ? account.balance.toFixed(2) 
                        : account.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No account balances found. Run the demo to create sample transactions.</p>
        )}
      </div>
    </div>
  );
} 