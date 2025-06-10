"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, ChevronDown, ChevronRight, FileText, LineChart, PieChart, DollarSign } from "lucide-react";

export function ReportsMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // State for this menu's expansion
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false); // State for financial submenu

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const toggleFinancialMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFinancialExpanded(!isFinancialExpanded);
  };

  const reportItems = [
    { label: "Day Book", href: "/dashboard/accounting/reports/day-book", icon: <PieChart className="h-4 w-4" /> },
    { label: "Transaction Ledger", href: "/dashboard/accounting/ledger", icon: <FileText className="h-4 w-4" /> },
    { 
      label: "Financial Statements", 
      href: "/dashboard/accounting/reports", 
      icon: <LineChart className="h-4 w-4" />,
      isSubmenu: true,
      toggleSubmenu: toggleFinancialMenu,
      expanded: isFinancialExpanded,
      items: [
        { label: "Income Statement", href: "/dashboard/accounting/reports/income-statement", icon: <DollarSign className="h-4 w-4" /> },
        { label: "Balance Sheet", href: "/dashboard/accounting/reports/balance-sheet", icon: <DollarSign className="h-4 w-4" /> },
        { label: "General Ledger", href: "/dashboard/accounting/reports/general-ledger", icon: <DollarSign className="h-4 w-4" /> },
      ]
    },
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
               <li key={index} className="relative">
                 {item.isSubmenu ? (
                   <>
                     <div 
                       className="flex items-center justify-between gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                       onClick={item.toggleSubmenu}
                     >
                       <div className="flex items-center gap-2">
                         {item.icon}
                         <span>{item.label}</span>
                       </div>
                       {item.expanded ? (
                         <ChevronDown className="h-3 w-3" />
                       ) : (
                         <ChevronRight className="h-3 w-3" />
                       )}
                     </div>
                     {item.expanded && (
                       <ul className="pl-6">
                         {item.items.map((subItem, subIndex) => (
                           <li key={subIndex}>
                             <Link
                               href={subItem.href}
                               className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                             >
                               {subItem.icon}
                               <span>{subItem.label}</span>
                             </Link>
                           </li>
                         ))}
                       </ul>
                     )}
                   </>
                 ) : (
                   <Link
                     href={item.href}
                     className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                   >
                     {item.icon}
                     <span>{item.label}</span>
                   </Link>
                 )}
               </li>
             ))}
           </ul>
         )}
      </div>
    </li>
  );
} 