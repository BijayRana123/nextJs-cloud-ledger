"use client"; // Add client directive

import React from 'react'; // Remove useState and useEffect
import { Sidebar } from '@/app/components/sidebar'; // Import Sidebar component
import { TopNavbar } from '@/app/components/top-navbar'; // Import TopNavbar component
import { OrganizationProvider } from '@/lib/context/OrganizationContext'; // Import OrganizationProvider
import { CalendarProvider } from '@/lib/context/CalendarContext'; // Import CalendarProvider

export default function DashboardLayout({ children }) {
  // Removed local state and useEffect for organizationId as it's now in the Provider

  return (
    <div className="flex flex-col h-screen bg-gray-100"> {/* Change to flex-col */}
      {/* Wrap the entire layout content with the providers */}
      <OrganizationProvider>
        <CalendarProvider>
          {/* Header */}
          <TopNavbar />

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden"> {/* New flex container for sidebar and main content */}
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
                {children}
            </main>
          </div>
        </CalendarProvider>
      </OrganizationProvider>
    </div>
  );
}
