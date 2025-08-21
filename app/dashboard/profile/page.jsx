"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin, Globe, Hash, Briefcase, FileText, Calendar, Save, Edit, X } from "lucide-react";

export default function ProfilePage() {
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentOrganization?._id) {
      fetchOrganizationDetails();
    }
  }, [currentOrganization]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organization', {
        headers: {
          'x-organization-id': currentOrganization._id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization details');
      }

      const data = await response.json();
      setOrganization(data.organization);
      setFormData(data.organization);
    } catch (error) {
      console.error('Error fetching organization details:', error);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrganization._id,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      const data = await response.json();
      setOrganization(data.organization);
      setIsEditing(false);
      toast.success('Organization details updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(organization);
    setIsEditing(false);
  };

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Organization details not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Profile</h1>
          <p className="text-gray-600 mt-1">Manage your organization details and settings</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter organization name"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.name || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="organizationId">Organization ID</Label>
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {organization.organizationId || 'Not assigned'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.email || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.phone || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="Enter website URL"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.website || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxId" className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Tax ID
                  </Label>
                  {isEditing ? (
                    <Input
                      id="taxId"
                      value={formData.taxId || ''}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="Enter tax ID"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.taxId || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="industry" className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Industry
                  </Label>
                  {isEditing ? (
                    <Input
                      id="industry"
                      value={formData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      placeholder="Enter industry"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.industry || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="code">Organization Code</Label>
                  {isEditing ? (
                    <Input
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="Enter organization code"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {organization.code || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter organization address"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded min-h-[60px]">
                    {organization.address || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter organization description"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded min-h-[60px]">
                    {organization.description || 'Not specified'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status and Metadata Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    organization.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {organization.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  {organization.createdAt 
                    ? new Date(organization.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not available'
                  }
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  {organization.updatedAt 
                    ? new Date(organization.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not available'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Organization Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                Organization Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}