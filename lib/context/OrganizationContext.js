"use client";

import { createContext, useContext, useState, useEffect } from 'react'; // Import useState and useEffect

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
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null); // State to hold the current organization ID

  useEffect(() => {
    // Check localStorage for organizationId on mount.
    // The organization setup page explicitly stores the new organization ID here.
    const storedOrganizationId = localStorage.getItem('organizationId');
    if (storedOrganizationId) {
      console.log("OrganizationProvider: useEffect - Found organizationId in localStorage:", storedOrganizationId);
      setCurrentOrganizationId(storedOrganizationId);
      // Clear the organizationId from localStorage after reading it,
      // as it's only needed for the initial selection after setup/login.
      // The active organization might be persisted elsewhere (e.g., in cookies/JWT).
      localStorage.removeItem('organizationId');
      console.log("OrganizationProvider: useEffect - Cleared organizationId from localStorage");

      // TODO: Fetch organization details using storedOrganizationId and set global context/state
      // For now, just setting the ID in state and logging.
    } else {
      // TODO: If no organizationId in localStorage, check for a default organization
      // from cookies/JWT or redirect to the organization selection page if multiple exist.
      console.log("OrganizationProvider: useEffect - No organizationId found in localStorage.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Log the currentOrganizationId state whenever it changes
  useEffect(() => {
    console.log("OrganizationProvider: currentOrganizationId state updated:", currentOrganizationId);
  }, [currentOrganizationId]);


  return (
    <OrganizationContext.Provider value={currentOrganizationId}> {/* Provide the state value */}
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
