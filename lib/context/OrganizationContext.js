"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Import Cookies

// Create the Organization Context
const OrganizationContext = createContext(null);

// Custom hook to use the Organization Context
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

// Organization Provider component (will be used in layout)
export const OrganizationProvider = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState(null); // State to hold the current organization object
  const [loading, setLoading] = useState(true); // State to track loading status
  
  // Function to update the current organization
  const updateCurrentOrganization = (organization) => {
    setCurrentOrganization(organization);
    if (organization && organization._id) {
      localStorage.setItem('currentOrganizationId', organization._id);

      // Force a full reload to ensure all data and context are refreshed
      window.location.reload();
    }
  };

  useEffect(() => {
    const fetchOrganization = async (orgId) => {
      try {
        // Check if org info is already cached
        const cachedOrg = localStorage.getItem(`orgInfo_${orgId}`);
        if (cachedOrg) {
          setCurrentOrganization(JSON.parse(cachedOrg));
          setLoading(false);
          return;
        }
        // Fetch user's organizations
        const response = await fetch('/api/user/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const data = await response.json();
        const organizations = data.organizations;

        // Find the organization matching the current ID
        const foundOrg = organizations.find(org => org._id === orgId);
        if (foundOrg) {
          setCurrentOrganization(foundOrg);
          localStorage.setItem('currentOrganizationId', orgId);
          localStorage.setItem(`orgInfo_${orgId}` , JSON.stringify(foundOrg));

        } else {
          console.error("OrganizationProvider: Organization not found for ID:", orgId);
          setCurrentOrganization(null); // Clear organization if not found
          localStorage.removeItem('currentOrganizationId');
          localStorage.removeItem('organizationId');
          window.location.href = '/onboarding/select-organization';
        }
      } catch (error) {
        console.error("OrganizationProvider: Error fetching organization:", error);
        setCurrentOrganization(null); // Clear organization on error
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    // First check if we have a currentOrganizationId in localStorage (for persistence across page navigations)
    const currentOrgId = localStorage.getItem('currentOrganizationId');
    if (currentOrgId) {

      fetchOrganization(currentOrgId);
      return; // Exit early if we found a current organization ID
    }

    // Check localStorage for organizationId on mount (used after setup/login)
    const storedOrganizationId = localStorage.getItem('organizationId');
    if (storedOrganizationId) {

      fetchOrganization(storedOrganizationId);
      // Don't remove the organizationId immediately, only after we've confirmed the organization exists
      // We'll store it as currentOrganizationId in the fetchOrganization function if successful
    } else {
      // If not in localStorage, try to get the default organization ID from the auth cookie
      const authToken = Cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token');
      if (authToken) {
        try {
          // Decode JWT to get the organizationId from the payload
          // Note: This is a basic client-side decode. For production,
          // you might want a dedicated API route to get user/org info securely.
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          const orgIdFromToken = payload.user.organizationId;
          if (orgIdFromToken) {

            fetchOrganization(orgIdFromToken);
          } else {

            setCurrentOrganization(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("OrganizationProvider: Error decoding auth token:", error);
          setCurrentOrganization(null);
          setLoading(false);
        }
      } else {

        setCurrentOrganization(null);
        setLoading(false);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Log the currentOrganization state whenever it changes
  useEffect(() => {

  }, [currentOrganization]);


  return (
    <OrganizationContext.Provider value={{ 
      currentOrganization, 
      loading, 
      updateCurrentOrganization 
    }}> {/* Provide the state value, loading status, and update function */}
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
