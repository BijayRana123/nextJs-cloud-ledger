"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent,CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select component exists

export default function SelectOrganizationPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Fetch user's organizations from the backend
    // Assuming an API endpoint like /api/user/organizations exists
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/user/organizations'); // TODO: Implement this API route
        if (!res.ok) {
          throw new Error(`Error fetching organizations: ${res.statusText}`);
        }
        const data = await res.json();
        setOrganizations(data.organizations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleSelectOrganization = async (orgId) => {

    try {
      const res = await fetch('/api/user/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOrganizationId: orgId }), // Change key to newOrganizationId
      });

      if (!res.ok) {
        throw new Error(`Error switching organization: ${res.statusText}`);
      }

      // Redirect to the dashboard after switching
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateNewOrganization = () => {
    // Redirect to the organization setup wizard page
    router.push('/onboarding/org-setup');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Loading organizations...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Select or Create Organization</CardTitle>
          <CardDescription>Choose an existing organization or create a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 && (
            <div className="grid w-full items-center gap-4 mb-6">
              <Label htmlFor="existing-organization">Select Existing Organization</Label>
              <Select onValueChange={handleSelectOrganization}>
                <SelectTrigger id="existing-organization">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org._id} value={org._id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-center mb-6">Or</div>

          <Button onClick={handleCreateNewOrganization} className="w-full">
            Create New Organization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
