import React, { useState } from 'react';
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { getCookie } from '@/lib/utils';

const AddCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    pan: '',
    phoneNumber: '',
    email: '',
    isAlsoSupplier: false,
    supplierCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerData({
      ...customerData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch('/api/organization/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      const result = await response.json();
      if (response.ok) {
        onCustomerCreated && onCustomerCreated(result.customer);
        onClose && onClose();
      } else {
        setError(result.message || 'Failed to create customer');
      }
    } catch (err) {
      setError('An error occurred while creating the customer');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" name="name" value={customerData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={customerData.address} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="pan">PAN</Label>
            <Input id="pan" name="pan" value={customerData.pan} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" value={customerData.phoneNumber} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={customerData.email} onChange={handleChange} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isAlsoSupplier" name="isAlsoSupplier" checked={customerData.isAlsoSupplier} onChange={handleChange} className="h-4 w-4" />
            <Label htmlFor="isAlsoSupplier">This customer is also a supplier</Label>
          </div>
          {customerData.isAlsoSupplier && (
            <div>
              <Label htmlFor="supplierCode">Supplier Code</Label>
              <Input id="supplierCode" name="supplierCode" value={customerData.supplierCode} onChange={handleChange} placeholder="Enter existing supplier code" />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Customer'}</Button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerModal; 
