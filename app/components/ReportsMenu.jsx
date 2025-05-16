"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, ChevronDown, ChevronRight, FileText, LineChart, PieChart } from "lucide-react";

export function ReportsMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // State for this menu's expansion

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const reportItems = [
    { label: "Transaction Ledger", href: "/dashboard/accounting/ledger", icon: <FileText className="h-4 w-4" /> },
    { label: "Financial Statements", href: "/dashboard/reports/financial-statements", icon: <LineChart className="h-4 w-4" /> },
    { label: "Tax Reports", href: "/dashboard/reports/tax", icon: <PieChart className="h-4 w-4" /> },
  ];

  return (
    <li className="border-b last:border-b-0 relative group"> {/* Add relative positioning and group class */}
      <div>
        <button
          className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isMenuExpanded && isSidebarExpanded ? "bg-gray-100" : ""} ${!isSidebarExpanded ? 'justify-center' : ''}`} // Adjust alignment and background when sidebar is collapsed
          onClick={toggleMenu}
        >
          <div className={`flex items-center gap-3 ${!isSidebarExpanded ? 'justify-center w-full' : ''}`}> {/* Adjust alignment and width */}
            <BarChart2 className="h-5 w-5" />
            {isSidebarExpanded && <span>Reports</span>} {/* Conditionally render label */}
          </div>
          {isSidebarExpanded && ( // Only show chevron when sidebar is expanded
            isMenuExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
        {/* Conditionally render submenu based on menu expanded state */}
        {isMenuExpanded && (
           <ul className={`${isSidebarExpanded ? '' : 'absolute left-full top-0 w-48 bg-white border rounded-md shadow-lg'}`}> {/* Adjust positioning based on sidebar state */}
             {reportItems.map((item, index) => (
               <li key={index}>
                 <Link
                   href={item.href}
                   className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                 >
                   {item.icon}
                   <span>{item.label}</span>
                 </Link>
               </li>
             ))}
           </ul>
         )}
      </div>
    </li>
  );
} 