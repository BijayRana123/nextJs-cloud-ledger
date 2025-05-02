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

  useEffect(() => {
    const fetchOrganization = async (orgId) => {
      try {
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
          console.log("OrganizationProvider: Fetched and set current organization:", foundOrg);
        } else {
          console.error("OrganizationProvider: Organization not found for ID:", orgId);
          setCurrentOrganization(null); // Clear organization if not found
        }
      } catch (error) {
        console.error("OrganizationProvider: Error fetching organization:", error);
        setCurrentOrganization(null); // Clear organization on error
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    // Check localStorage for organizationId on mount (used after setup/login)
    const storedOrganizationId = localStorage.getItem('organizationId');
    if (storedOrganizationId) {
      console.log("OrganizationProvider: useEffect - Found organizationId in localStorage:", storedOrganizationId);
      fetchOrganization(storedOrganizationId);
      localStorage.removeItem('organizationId'); // Clear after reading
      console.log("OrganizationProvider: useEffect - Cleared organizationId from localStorage");
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
            console.log("OrganizationProvider: useEffect - Found organizationId in auth token:", orgIdFromToken);
            fetchOrganization(orgIdFromToken);
          } else {
            console.log("OrganizationProvider: useEffect - No organizationId found in auth token payload.");
            setCurrentOrganization(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("OrganizationProvider: Error decoding auth token:", error);
          setCurrentOrganization(null);
          setLoading(false);
        }
      } else {
        console.log("OrganizationProvider: useEffect - No organizationId found in localStorage or auth token.");
        setCurrentOrganization(null);
        setLoading(false);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Log the currentOrganization state whenever it changes
  useEffect(() => {
    console.log("OrganizationProvider: currentOrganization state updated:", currentOrganization);
  }, [currentOrganization]);


  return (
    <OrganizationContext.Provider value={{ currentOrganization, loading }}> {/* Provide the state value and loading status */}
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
