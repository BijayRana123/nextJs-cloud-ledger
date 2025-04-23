"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ChevronDown, ChevronRight, Plus } from "lucide-react";

export function PurchaseMenu({ isExpanded: isSidebarExpanded }) { // Accept isExpanded prop from sidebar
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // State for this menu's expansion

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const submenuItems = [
    { label: "Purchase Voucher", href: "/dashboard/purchase/add-purchase-bill", icon: <Plus className="h-4 w-4" /> }, // Updated href
    { label: "Purchase Return Voucher", href: "#", icon: <Plus className="h-4 w-4" /> },
  ];

  return (
    <li className="border-b last:border-b-0">
      <div>
        <button
          className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isMenuExpanded ? "bg-gray-100" : ""} ${!isSidebarExpanded && 'justify-center'}`} // Adjust alignment when sidebar is collapsed
          onClick={toggleMenu}
        >
          <div className={`flex items-center gap-3 ${!isSidebarExpanded && 'justify-center w-full'}`}> {/* Adjust alignment and width */}
            <ShoppingCart className="h-5 w-5" />
            {isSidebarExpanded && <span>Purchase</span>} {/* Conditionally render label */}
          </div>
          {isSidebarExpanded && ( // Only show chevron when sidebar is expanded
            isMenuExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
        {isSidebarExpanded && isMenuExpanded && ( // Only show submenu when sidebar and menu are expanded
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
        )}
      </div>
    </li>
  );
}
