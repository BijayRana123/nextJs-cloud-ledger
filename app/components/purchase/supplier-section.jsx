"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  
import CreateNewSupplierModal from "@/app/components/create-new-supplier-modal";
import SupplierDetailsModal from "@/app/components/supplier-details-modal";

// Function to get the authentication token from cookies
const getCookie = (name) => {
  if (typeof document === 'undefined') return null; // Ensure document is available
  
  console.log('getCookie: Searching for cookie:', name);
  console.log('getCookie: All cookies:', document.cookie); // Log all cookies for debugging
  
  // Standard cookie parsing approach
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    // Get the raw cookie value and decode it from URL encoding
    const rawCookieValue = parts.pop().split(';').shift();
    const cookieValue = decodeURIComponent(rawCookieValue);
    console.log('getCookie: Found raw cookie value:', rawCookieValue);
    console.log('getCookie: Decoded cookie value:', cookieValue);
    
    try {
      // Attempt to parse the decoded cookie value as a JSON array and get the first element
      const cookieArray = JSON.parse(cookieValue);
      console.log('getCookie: Result of JSON.parse:', cookieArray);
      
      if (Array.isArray(cookieArray) && cookieArray.length > 0 && typeof cookieArray[0] === 'string') {
        console.log('getCookie: Successfully parsed and found token.');
        return cookieArray[0]; // The actual JWT is the first element
      } else {
        console.log('getCookie: Unexpected cookie value format, returning decoded value');
        return cookieValue; // Return the decoded value as fallback
      }
    } catch (parseError) {
      console.log('getCookie: Error parsing JSON:', parseError);
      
      // Check if the value itself looks like a JWT (has two dots separating three parts)
      if (cookieValue.split('.').length === 3) {
        console.log('getCookie: Value appears to be a JWT, returning as-is');
        return cookieValue;
      }
      
      // Try to extract a JWT from the string (looking for a pattern that looks like a JWT)
      const jwtMatch = cookieValue.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
      if (jwtMatch) {
        console.log('getCookie: Found JWT pattern in string:', jwtMatch[0]);
        return jwtMatch[0];
      }
      
      console.log('getCookie: Could not extract JWT, returning decoded value:', cookieValue);
      return cookieValue;
    }
  }
  
  // If no cookie found with the specific name, look for any auth-related cookie
  const allCookies = document.cookie.split('; ');
  const authCookies = allCookies.filter(c => c.includes('auth') || c.includes('token'));
  
  if (authCookies.length > 0) {
    console.log('getCookie: No specific cookie found, but found other auth cookies:', authCookies);
    // You could implement fallback logic here if needed
  }
  
  console.error(`getCookie: Authentication token not found in cookie: ${name}`);
  console.error('getCookie: Please ensure you are logged in. Redirecting to login page.');
  return null;
};

export default function SupplierSection({ formData, setFormData }) {
  const router = useRouter();
  // State to control the new supplier modal visibility
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  // State to store details of the selected supplier
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
  // State to manage the supplier combobox options
  const [supplierOptions, setSupplierOptions] = useState([]);
  // State to control the supplier details modal visibility
  const [isSupplierDetailsModalOpen, setIsSupplierDetailsModalOpen] = useState(false);
  // State to track if suppliers are loading
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Using dynamic import with next/dynamic for client-side only rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all suppliers when component mounts
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!mounted) return;

      setIsLoadingSuppliers(true);
      try {
        // Retrieve the JWT from the cookie
        const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');
        console.log("SupplierSection: authToken from cookie:", authToken ? authToken.substring(0, 20) + '...' : 'null'); // Add logging with partial token
        console.log("SupplierSection: Type of authToken:", typeof authToken); // Add logging for type
        
        // For debugging: Check if the token is properly formatted
        if (authToken) {
          try {
            // Split the token to check its structure (header.payload.signature)
            const tokenParts = authToken.split('.');
            console.log("SupplierSection: Token parts count:", tokenParts.length);
            
            if (tokenParts.length !== 3) {
              console.error("SupplierSection: Token does not have the expected JWT format (header.payload.signature)");
            } else {
              console.log("SupplierSection: Token has valid JWT format with 3 parts");
              
              // Decode the payload (middle part) to check its content
              try {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log("SupplierSection: Decoded token payload:", payload);
              } catch (e) {
                console.error("SupplierSection: Error decoding token payload:", e);
              }
            }
          } catch (e) {
            console.error("SupplierSection: Error analyzing token format:", e);
          }
        }

        if (!authToken) {
          console.error("SupplierSection: Authentication token not found in cookie.");
          console.error("SupplierSection: You need to log in to access this page.");
          
          // Show a user-friendly message before redirecting
          if (typeof window !== 'undefined') {
            // Only show alert in browser environment
            alert("Your session has expired or you are not logged in. You will be redirected to the login page.");
          }
          
          // Redirect to login page with return URL to come back after login
          const currentPath = window.location.pathname;
          router.push(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`);
          setIsLoadingSuppliers(false);
          return;
        }

        console.log("SupplierSection: Fetching suppliers with token:", authToken ? authToken.substring(0, 10) + '...' : 'null'); // Log partial token for security
        console.log("SupplierSection: Authorization header:", `Bearer ${authToken ? authToken.substring(0, 10) + '...' : 'null'}`);

        const response = await fetch('/api/organization/suppliers', {
          headers: {
            'Authorization': `Bearer ${authToken}`, // Include the JWT in the Authorization header
            'Content-Type': 'application/json',
          },
        });

        console.log("SupplierSection: Fetch response status:", response.status); // Log response status
        
        // If there's an error, log more details
        if (!response.ok) {
          const errorData = await response.json().catch(e => ({ message: 'Could not parse error response' }));
          console.error("SupplierSection: API error response:", errorData);
          
          if (response.status === 401) {
            console.error("SupplierSection: Authorization error (401). Redirecting to login.");
          }
        }

        if (response.ok) {
          const result = await response.json();
          // Format suppliers for the combobox - include name and address
          const formattedOptions = result.suppliers.map(supplier => ({
            value: supplier._id,
            label: supplier.name + (supplier.address ? ` - ${supplier.address}` : ''),
            // Store the full supplier object for reference
            supplierData: supplier
          }));

          setSupplierOptions(formattedOptions);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`SupplierSection: Authorization error (${response.status}). Redirecting to login.`);
          router.push('/auth/login');
        }
         else {
          const result = await response.json();
          console.error("Error fetching suppliers:", result.message);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setIsLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [mounted]);

  // Fetch supplier details when supplierName changes
  useEffect(() => {
    const fetchSupplierDetails = async () => {
      const supplierId = formData.supplierName;
      if (supplierId) {
        try {
          const response = await fetch(`/api/organization/suppliers/${supplierId}`);
          const result = await response.json();
          if (response.ok) {
            const fetchedSupplier = result.supplier;
            setSelectedSupplierDetails(fetchedSupplier);

            // Ensure the fetched supplier is in the combobox options
            setSupplierOptions((prevOptions) => {
              if (!prevOptions.some(option => option.value === fetchedSupplier._id)) {
                return [...prevOptions, { value: fetchedSupplier._id, label: fetchedSupplier.name }];
              }
              return prevOptions;
            });

          } else {
            console.error("Error fetching supplier details:", result.message);
            setSelectedSupplierDetails(null);
          }
        } catch (error) {
          console.error("Error fetching supplier details:", error);
          setSelectedSupplierDetails(null);
        }
      } else {
        setSelectedSupplierDetails(null);
      }
    };

    fetchSupplierDetails();
  }, [formData.supplierName]);

   const handleSelectChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };


  return (
    <>
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Combobox
               className="w-full"
                options={supplierOptions}
                value={formData.supplierName}
                onValueChange={(value) => handleSelectChange('supplierName', value)}
                placeholder="Select Supplier"
                onAddNew={() => setIsNewSupplierModalOpen(true)}
              />
              {selectedSupplierDetails && (
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                  <div>
                    <strong>PAN Number:</strong> {selectedSupplierDetails.pan || 'N/A'}
                  </div>
                  <div>
                    <strong>Address:</strong> {selectedSupplierDetails.address || 'N/A'}
                  </div>
                  <div>
                    <strong>Code:</strong> {selectedSupplierDetails.code || 'N/A'}
                  </div>
                  <div>
                    <a href="#" className="text-blue-600 hover:underline" onClick={(e) => {
                      e.preventDefault();
                      setIsSupplierDetailsModalOpen(true);
                    }}>View Details</a>
                  </div>
                </div>
              )}
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="referenceNo">Reference No</Label>
              <div className="flex items-center gap-2">
                 <Input id="referenceNo" placeholder="Reference" value={formData.referenceNo} onChange={handleInputChange} />
                 <SearchIcon className="h-5 w-5 text-gray-500" />
              </div>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input id="billNumber" placeholder="Bill Number" value={formData.billNumber} onChange={handleInputChange} />
            </div>
            {/* Bill Date and Due Date will remain in the main page component */}
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplierInvoiceReferenceNo">Supplier Invoice Reference No</Label>
              <Input id="supplierInvoiceReferenceNo" placeholder="Reference" value={formData.supplierInvoiceReferenceNo} onChange={handleInputChange} />
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nepalese Rupee">Nepalese Rupee</SelectItem>
                  {/* Add other currency options as needed */}
                </SelectContent>
              </Select>
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="exchangeRateToNPR">Exchange Rate To NPR</Label>
              <Input id="exchangeRateToNPR" type="number" value={formData.exchangeRateToNPR} onChange={handleInputChange} />
            </div>
             <div className="flex items-center space-x-2">
              <input type="checkbox" id="isImport" checked={formData.isImport} onChange={handleInputChange} />
              <Label htmlFor="isImport">Is Import</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Supplier Modal */}
      <CreateNewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSupplierCreated={(newSupplier) => {
          console.log("New supplier created:", newSupplier);

          const supplierId = newSupplier._id || newSupplier.id || newSupplier.code;

          setSupplierOptions((prevOptions) => [
            ...prevOptions,
            {
              value: supplierId,
              label: newSupplier.name + (newSupplier.address ? ` - ${newSupplier.address}` : ''),
              supplierData: newSupplier
            }
          ]);

          setTimeout(() => {
            handleSelectChange('supplierName', supplierId);
            setSelectedSupplierDetails(newSupplier);
          }, 100);
        }}
      />

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        isOpen={isSupplierDetailsModalOpen}
        onClose={() => setIsSupplierDetailsModalOpen(false)}
        supplier={selectedSupplierDetails}
      />
    </>
  );
}
