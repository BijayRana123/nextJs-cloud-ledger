'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils';
import useSWR from 'swr';

// Modal for adding a new customer
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
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      
      // Make the API call with the authentication token
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
        console.log('Customer created successfully:', result.customer);
        onCustomerCreated(result.customer);
        onClose();
      } else {
        setError(result.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
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
            <Input 
              id="name" 
              name="name" 
              value={customerData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={customerData.address} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <Label htmlFor="pan">PAN</Label>
            <Input 
              id="pan" 
              name="pan" 
              value={customerData.pan} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input 
              id="phoneNumber" 
              name="phoneNumber" 
              value={customerData.phoneNumber} 
              onChange={handleChange} 
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email"
              value={customerData.email} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAlsoSupplier"
              name="isAlsoSupplier"
              checked={customerData.isAlsoSupplier}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <Label htmlFor="isAlsoSupplier">This customer is also a supplier</Label>
          </div>
          
          {customerData.isAlsoSupplier && (
            <div>
              <Label htmlFor="supplierCode">Supplier Code</Label>
              <Input 
                id="supplierCode" 
                name="supplierCode" 
                value={customerData.supplierCode} 
                onChange={handleChange} 
                placeholder="Enter existing supplier code"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      </div>
      </div>
  );
};

const CustomerSection = ({ formData, setFormData, counterType = 'sales' }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nextSalesRefNo, setNextSalesRefNo] = useState('');
  const router = useRouter();

  // Use SWR for fetching customers
  const fetcher = url => fetch(url).then(res => res.json());
  const { data: customersData, isLoading: isLoadingCustomers } = useSWR(
    '/api/organization/customers',
    fetcher
  );

  useEffect(() => {
    if (customersData && Array.isArray(customersData.customers)) {
      const formattedOptions = customersData.customers.map(customer => ({
        value: customer._id,
        label: customer.name + (customer.address ? ` - ${customer.address}` : ''),
        customerData: customer
      }));
      setOptions(formattedOptions);
    }
  }, [customersData]);

  // Fetch customer details when a customer is selected
  useEffect(() => {
    if (formData.customerName) {
      fetchCustomerDetails(formData.customerName);
    }
  }, [formData.customerName]);

  // Fetch next sales reference number on mount
  useEffect(() => {
    fetchNextSalesRefNo();
  }, [counterType]);

  // Fetch next sales reference number when customer changes (optional, or only on mount)
  useEffect(() => {
    if (formData.customerName && nextSalesRefNo) {
      setFormData(prev => ({
        ...prev,
        referenceNo: nextSalesRefNo
      }));
    }
  }, [formData.customerName, nextSalesRefNo, setFormData]);

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return;
    
    setIsLoading(true);
    try {
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      
      console.log("CustomerDetails: Using auth token:", authToken ? authToken.substring(0, 10) + '...' : 'null');
      
      // Make the API call with the authentication token
      const response = await fetch(`/api/organization/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("CustomerDetails: Fetch response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        const fetchedCustomer = result.customer;
        console.log("CustomerDetails: Successfully fetched customer:", fetchedCustomer.name);
        setCustomerDetails(fetchedCustomer);
      } else {
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
          console.error(`CustomerDetails: Authorization error (${response.status}). Redirecting to login.`);
          // Use window.location for navigation instead of router to avoid dependency
          window.location.href = '/auth/login';
        } else {
          console.error("CustomerDetails: Failed to fetch customer details:", response.status);
          setCustomerDetails(null);
        }
      }
    } catch (err) {
      console.error("CustomerDetails: Error fetching customer details:", err);
      setCustomerDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerCreated = (newCustomer) => {
    console.log("New customer created:", newCustomer);
    
    // Format the new customer for the combobox
    const newOption = {
      value: newCustomer._id,
      label: newCustomer.name + (newCustomer.address ? ` - ${newCustomer.address}` : ''),
      customerData: newCustomer
    };
    
    // Add the new customer to the options
    setOptions(prevOptions => [...prevOptions, newOption]);
    
    // Select the new customer
    setFormData(prevData => ({
      ...prevData,
      customerName: newCustomer._id
    }));
    
    // Set the customer details
    setCustomerDetails(newCustomer);
    
    // Close the combobox
    setOpen(false);
  };

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  // Limit displayed options to maximum 4
  const displayedOptions = React.useMemo(() => {
    return filteredOptions.slice(0, 4);
  }, [filteredOptions]);

  const fetchNextSalesRefNo = async () => {
    try {
      // Retrieve the JWT from the cookie (if needed for auth)
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      const response = await fetch(`/api/accounting/counters/next?type=${counterType}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNextSalesRefNo(data.nextNumber);
      } else {
        setNextSalesRefNo(counterType === 'salesreturn' ? 'SR-1001' : 'SO-1001'); // fallback
      }
    } catch (err) {
      setNextSalesRefNo(counterType === 'salesreturn' ? 'SR-1001' : 'SO-1001'); // fallback
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="customerName">Customer</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {formData.customerName ? 
                    options.find(option => option.value === formData.customerName)?.label : 
                    "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search customer..." 
                    value={inputValue}
                    onValueChange={setInputValue}
                  />
                  {displayedOptions.length === 0 && inputValue !== "" ? (
                    <CommandEmpty>No customer found.</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {displayedOptions.map((option) => (
                        <CommandItem
                          key={option.value || Math.random().toString()}
                          value={option.value}
                          onSelect={() => {
                            setFormData({ ...formData, customerName: option.value });
                            setOpen(false);
                            setInputValue('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.customerName === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => {
                          setIsModalOpen(true);
                          setOpen(false);
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Customer
                      </CommandItem>
                    </CommandGroup>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="referenceNo">Reference No.</Label>
            <Input
              id="referenceNo"
              value={formData.referenceNo || nextSalesRefNo || ''}
              placeholder="Auto-generated when customer selected"
              disabled={true}
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">System-generated, unique identifier</p>
          </div>

          {customerDetails && (
            <div className="md:col-span-2">
              <h3 className="font-medium mb-2">Customer Details</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p>{customerDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p>{customerDetails.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN</p>
                    <p>{customerDetails.pan || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{customerDetails.phoneNumber || 'N/A'}</p>
                  </div>
                  {customerDetails.relatedSupplier && (
                    <div>
                      <p className="text-sm text-gray-500">Also a Supplier</p>
                      <p>Yes - {customerDetails.relatedSupplier.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {isModalOpen && (
        <AddCustomerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </Card>
  );
};

export default CustomerSection;
