'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../../../components/ui/command";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/utils';
import useSWR from 'swr';
import AddCustomerModal from "@/components/sales/add-customer-modal";

const CustomerSection = ({ formData, setFormData, counterType = 'sales', voucherNumber }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nextSalesRefNo, setNextSalesRefNo] = useState('');
  const router = useRouter();

  // Use SWR for fetching customers
  const fetcher = url => {
    const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    }).then(res => res.json());
  };
  const { data: customersData, isLoading: isLoadingCustomers } = useSWR(
    '/api/organization/customers',
    fetcher
  );

  useEffect(() => {
    if (customersData && Array.isArray(customersData.customers)) {
      const formattedOptions = [
        { value: 'CASH', label: 'Cash', customerData: null },
        ...customersData.customers.map(customer => ({
        value: customer._id,
        label: customer.name + (customer.address ? ` - ${customer.address}` : ''),
        customerData: customer
        }))
      ];
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
    if (!customerId || customerId === 'CASH') {
      setCustomerDetails(null);
      return;
    }
    
    setIsLoading(true);
    try {
      // Retrieve the JWT from the cookie
      const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      

      
      // Make the API call with the authentication token
      const response = await fetch(`/api/organization/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      

      
      if (response.ok) {
        const result = await response.json();
        const fetchedCustomer = result.customer;

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
        setNextSalesRefNo(counterType === 'salesreturn' ? 'SR-1001' : 'SV-1001'); // fallback
      }
    } catch (err) {
      setNextSalesRefNo(counterType === 'salesreturn' ? 'SR-1001' : 'SV-1001'); // fallback
    }
  };

  return (
    
    
        <>
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
                            setFormData({ ...formData, customerName: option.value, isCashSale: option.value === 'CASH' });
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

          {/* Show Sales Voucher No for sales, styled like sales return */}
          {counterType === 'sales' && (
            <div>
              <Label htmlFor="billNumber">Sales Voucher No</Label>
              <div className="text-gray-500 text-sm bg-gray-50 rounded px-3 py-2 border border-gray-200">Sales Voucher No will be generated after saving.</div>
            </div>
          )}
          {/* Only show Sales Return Voucher No. for sales returns, not for sales vouchers */}
          {counterType === 'salesreturn' && (
            <div>
              <Label htmlFor="referenceNo">Sales Return Voucher No.</Label>
              <div className="text-gray-500 text-sm bg-gray-50 rounded px-3 py-2 border border-gray-200">Sales Return Voucher No will be generated after saving.</div>
            </div>
          )}

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
      

      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCustomerCreated={handleCustomerCreated} />
   </>
  );
};

export default CustomerSection;
