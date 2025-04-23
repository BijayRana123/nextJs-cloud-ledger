import React from 'react';
import { Sidebar } from '@/app/components/sidebar'; // Import Sidebar component
import { TopNavbar } from '@/app/components/top-navbar'; // Import TopNavbar component

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-gray-100"> {/* Change to flex-col */}
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
    </div>
  );
}
