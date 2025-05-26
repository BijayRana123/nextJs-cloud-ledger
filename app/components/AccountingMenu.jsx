"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, ChevronDown, ChevronRight, Plus, Book, PlusCircle, List, Clock } from "lucide-react";

export function AccountingMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // State for this menu's expansion
  const [isJournalSubmenuExpanded, setIsJournalSubmenuExpanded] = useState(false); // State for journal entries submenu

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const toggleJournalSubmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsJournalSubmenuExpanded(!isJournalSubmenuExpanded);
  };

  const transactionItems = [
    { label: "Payment Voucher", href: "/dashboard/accounting/transactions/pay-supplier", icon: <Plus className="h-4 w-4" /> },
    { label: "Receipt Voucher", href: "/dashboard/accounting/transactions/receive-payment", icon: <Plus className="h-4 w-4" /> },
    { label: "Expense Voucher", href: "/dashboard/accounting/transactions/record-expense", icon: <Plus className="h-4 w-4" /> },
    { label: "Income Voucher", href: "/dashboard/accounting/transactions/record-other-income", icon: <Plus className="h-4 w-4" /> },
    { label: "Contra Voucher", href: "/dashboard/accounting/transactions/contra-voucher", icon: <span className="h-4 w-4">🔄</span> },
  ];

  const journalItems = [
    { label: "All Journal Entries", href: "/dashboard/accounting/journal-entries", icon: <List className="h-4 w-4" /> },
    { label: "New Journal Entry", href: "/dashboard/accounting/journal-entries/new", icon: <PlusCircle className="h-4 w-4" /> },
  ];

  const salesItems = [
    // Remove 'Add Sales' and 'Add Sales Return' from this array
    // ... keep only list, report, and other relevant links ...
  ];

  return (
    <li className="border-b last:border-b-0 relative group"> {/* Add relative positioning and group class */}
      <div>
        <button
          className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isMenuExpanded && isSidebarExpanded ? "bg-gray-100" : ""} ${!isSidebarExpanded ? 'justify-center' : ''}`} // Adjust alignment and background when sidebar is collapsed
          onClick={toggleMenu}
        >
          <div className={`flex items-center gap-3 ${!isSidebarExpanded ? 'justify-center w-full' : ''}`}> {/* Adjust alignment and width */}
            <DollarSign className="h-5 w-5" />
            {isSidebarExpanded && <span>Accounting</span>} {/* Conditionally render label */}
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
             {/* Journal Entries section with submenu */}
             <li key="journal-entries" className="relative">
               <button
                 onClick={toggleJournalSubmenu}
                 className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
               >
                 <div className="flex items-center gap-2">
                   <Book className="h-4 w-4" />
                   <span>Journal Entries</span>
                 </div>
                 {isJournalSubmenuExpanded ? (
                   <ChevronDown className="h-4 w-4" />
                 ) : (
                   <ChevronRight className="h-4 w-4" />
                 )}
               </button>
               {isJournalSubmenuExpanded && (
                 <ul className="pl-6">
                   {journalItems.map((item, index) => (
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
             </li>
             
             {/* Transactions section */}
             <li key="transactions" className="relative">
               <div className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium">
                 <Clock className="h-4 w-4" />
                 <span>Transactions</span>
               </div>
               <ul className="pl-6">
                 {transactionItems.map((item, index) => (
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
             </li>
           </ul>
         )}
      </div>
    </li>
  );
}
