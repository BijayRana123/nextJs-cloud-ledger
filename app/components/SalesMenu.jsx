"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ChevronDown, ChevronRight, Plus } from "lucide-react";

export function SalesMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // State for this menu's expansion

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const submenuItems = [
    { label: "Sales Vouchers", href: "/dashboard/sales/sales-vouchers", icon: <Plus className="h-4 w-4" /> },
    { label: "Sales Return Vouchers", href: "/dashboard/sales/sales-return-vouchers", icon: <Plus className="h-4 w-4" /> },
  ];

  return (
    <li className="border-b last:border-b-0 relative group"> {/* Add relative positioning and group class */}
      <div>
        <button
          onClick={toggleMenu}
          className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isMenuExpanded && isSidebarExpanded ? "bg-gray-100" : ""} ${!isSidebarExpanded ? 'justify-center' : ''}`}> {/* Adjust alignment and background when sidebar is collapsed */}
          <div className={`flex items-center gap-3 ${!isSidebarExpanded ? 'justify-center w-full' : ''}`}> {/* Adjust alignment and width */}
            <ShoppingCart className="h-5 w-5" />
            {isSidebarExpanded && <span>Sales</span>} {/* Conditionally render label */}
          </div>
          {isSidebarExpanded && ( // Only show chevron when sidebar is expanded
            isMenuExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
        {/* Conditionally render submenu based on sidebar expanded state and menu expanded state or group hover */}
        {isSidebarExpanded ? (
          isMenuExpanded && (
            <ul className="bg-gray-50">
              {submenuItems.map((subItem, subIndex) => (
                <li key={subIndex}>
                  <Link
                    href={subItem.href}
                    className={`flex items-center justify-between px-4 py-3 pl-12 text-gray-700 hover:bg-gray-100`}
                  >
                    <span>{subItem.label}</span>
                    {subItem.icon}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="absolute left-full top-0 w-48 bg-white border rounded-md shadow-lg hidden group-hover:block"> {/* Show on hover when sidebar is collapsed */}
            {submenuItems.map((subItem, subIndex) => (
              <li key={subIndex}>
                <Link
                  href={subItem.href}
                  className={`flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100`}
                >
                  {subItem.icon}
                  <span>{subItem.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
