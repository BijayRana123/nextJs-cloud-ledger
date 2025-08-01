"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Combobox } from "../../../components/ui/combobox";
import { SearchIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "../../../components/ui/select"
  
import CreateNewSupplierModal from "@/components/create-new-supplier-modal";
import SupplierDetailsModal from "@/components/supplier-details-modal";

// Function to get the authentication token from cookies
const getCookie = (name) => {
  if (typeof document === 'undefined') return null; // Ensure document is available
  


  
  // Standard cookie parsing approach
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    // Get the raw cookie value and decode it from URL encoding
    const rawCookieValue = parts.pop().split(';').shift();
    const cookieValue = decodeURIComponent(rawCookieValue);


    
    try {
      // Attempt to parse the decoded cookie value as a JSON array and get the first element
      const cookieArray = JSON.parse(cookieValue);

      
      if (Array.isArray(cookieArray) && cookieArray.length > 0 && typeof cookieArray[0] === 'string') {

        return cookieArray[0]; // The actual JWT is the first element
      } else {

        return cookieValue; // Return the decoded value as fallback
      }
    } catch (parseError) {

      
      // Check if the value itself looks like a JWT (has two dots separating three parts)
      if (cookieValue.split('.').length === 3) {

        return cookieValue;
      }
      
      // Try to extract a JWT from the string (looking for a pattern that looks like a JWT)
      const jwtMatch = cookieValue.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
      if (jwtMatch) {

        return jwtMatch[0];
      }
      

      return cookieValue;
    }
  }
  
  // If no cookie found with the specific name, look for any auth-related cookie
  const allCookies = document.cookie.split('; ');
  const authCookies = allCookies.filter(c => c.includes('auth') || c.includes('token'));
  
  if (authCookies.length > 0) {

    // You could implement fallback logic here if needed
  }
  
  console.error(`getCookie: Authentication token not found in cookie: ${name}`);
  console.error('getCookie: Please ensure you are logged in. Redirecting to login page.');
  return null;
};

export default function SupplierSection({ formData, setFormData, children }) {
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

        
        // For debugging: Check if the token is properly formatted
        if (authToken) {
          try {
            // Split the token to check its structure (header.payload.signature)
            const tokenParts = authToken.split('.');

            
            if (tokenParts.length !== 3) {
              console.error("SupplierSection: Token does not have the expected JWT format (header.payload.signature)");
            } else {

              
              // Decode the payload (middle part) to check its content
              try {
                const payload = JSON.parse(atob(tokenParts[1]));

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




        const response = await fetch('/api/organization/suppliers', {
          headers: {
            'Authorization': `Bearer ${authToken}`, // Include the JWT in the Authorization header
            'Content-Type': 'application/json',
          },
        });


        
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
          // Retrieve the JWT from the cookie
          const authToken = getCookie('sb-mnvxxmmrlvjgpnhditxc-auth-token');

          
          if (!authToken) {
            console.error("SupplierDetails: Authentication token not found in cookie.");
            return;
          }
          
          // Make the API call with the authentication token
          const response = await fetch(`/api/organization/suppliers/${supplierId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`, // Include the JWT in the Authorization header
              'Content-Type': 'application/json',
            },
          });
          

          
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
            
            // If unauthorized, redirect to login
            if (response.status === 401 || response.status === 403) {
              console.error(`SupplierDetails: Authorization error (${response.status}). Redirecting to login.`);
              // Use window.location for navigation instead of router to avoid dependency
              window.location.href = '/auth/login';
            }
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
  }, [formData.supplierName]); // Remove router from dependencies

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
            {/* Render children in the right column */}
            <div className="flex flex-col space-y-1.5">{children}</div>
          </div>
        </CardContent>
      </Card>

      {/* New Supplier Modal */}
      <CreateNewSupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSupplierCreated={(newSupplier) => {


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
