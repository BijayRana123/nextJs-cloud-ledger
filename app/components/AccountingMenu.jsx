"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, ChevronDown, ChevronRight, Plus, Book, PlusCircle, List, Clock } from "lucide-react";

export function AccountingMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const voucherItems = [
    { label: "Payment Voucher", href: "/dashboard/accounting/transactions/pay-supplier", icon: <Plus className="h-4 w-4" /> },
    { label: "Receipt Voucher", href: "/dashboard/accounting/transactions/receive-payment", icon: <Plus className="h-4 w-4" /> },
    { label: "Contra Voucher", href: "/dashboard/accounting/transactions/contra-voucher", icon: <Plus className="h-4 w-4" />, addNewHref: "/dashboard/accounting/transactions/contra-voucher" },
    { label: "Journal Voucher", href: "/dashboard/accounting/journal-entries", icon: <Plus className="h-4 w-4" />, addNewHref: "/dashboard/accounting/journal-entries/new" },
  ];

  const handleMenuClick = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  return (
    <li className="border-b last:border-b-0 relative group"> {/* Add relative positioning and group class */}
      <div>
        <button
          className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isMenuExpanded && isSidebarExpanded ? "bg-gray-100" : ""} ${!isSidebarExpanded ? 'justify-center' : ''}`}
          onClick={handleMenuClick}
        >
          <div className={`flex items-center gap-3 ${!isSidebarExpanded ? 'justify-center w-full' : ''}`}>
            <DollarSign className="h-5 w-5" />
            {isSidebarExpanded && <span>Accounting</span>}
          </div>
          {isSidebarExpanded && (
            isMenuExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
        {isMenuExpanded && (
          <ul className={`${isSidebarExpanded ? '' : 'absolute left-full top-0 w-56 bg-white border rounded-md shadow-lg'}`}>
            {voucherItems.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between group px-4 py-2 hover:bg-gray-100">
                <Link href={item.href} className="flex items-center gap-2 text-gray-700">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
                {item.addNew && (
                  <Link href={item.addNewHref} title={`Add New ${item.label}`}>
                    <Plus className="h-5 w-5 text-green-600 ml-2 group-hover:text-green-700" />
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
