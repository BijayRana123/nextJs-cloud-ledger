import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold">Dashboard Nav</div>
        <nav className="flex-grow p-4">
          {/* Navigation Links will go here */}
          <ul>
            <li>Link 1</li>
            <li>Link 2</li>
            <li>Link 3</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Placeholder */}
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <h1 className="text-xl font-semibold">Dashboard Header</h1>
          {/* User/Account Info will go here */}
          <div>User Info</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
