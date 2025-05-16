"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  Plus,
  Home,
  Users,
  Workflow,
  ShoppingCart,
  DollarSign,
  BarChart2,
  Package,
  Settings,
  MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateNewModal } from "./create-new-modal";
import { SalesMenu } from "./SalesMenu";
import { PurchaseMenu } from "./PurchaseMenu";
import { AccountingMenu } from "./AccountingMenu";
import { ReportsMenu } from "./ReportsMenu";


export function Sidebar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Determine expanded state based on the current route
    if (pathname === '/dashboard/purchase/add-purchase-bill') {
      setIsExpanded(false);
    } else {
      setIsExpanded(true); // Keep expanded for other paths, adjust as needed for other collapsed pages
    }
  }, [pathname]);


  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/dashboard",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "CRM",
      href: "#",
    },
    // Replace Sales menu with SalesMenu component, pass isExpanded prop
    { component: <SalesMenu key="sales" isExpanded={isExpanded} /> },
    // Replace Purchase menu with PurchaseMenu component, pass isExpanded prop
    { component: <PurchaseMenu key="purchase" isExpanded={isExpanded} /> },
    // Replace Accounting menu with AccountingMenu component, pass isExpanded prop
    { component: <AccountingMenu key="accounting" isExpanded={isExpanded} /> },
    // Replace Reports menu with ReportsMenu component, pass isExpanded prop
    { component: <ReportsMenu key="reports" isExpanded={isExpanded} /> },
    {
      icon: <Package className="h-5 w-5" />,
      label: "Inventory",
      href: "#",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Configurations",
      href: "#",
    },
  ];

  return (
    <>
      <aside className={`hidden md:flex ${isExpanded ? "w-60" : "w-16"} flex-col border-r bg-white transition-all duration-300 ease-in-out`}> {/* Apply conditional width and transition */}
        <div className={`p-4 flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}> {/* Adjust padding and add flex properties */}
           {/* {isExpanded && <span className="text-2xl font-bold">App Name</span>} Optional: Add app name when expanded */}
           {/* Removed toggle button */}
           {/* <Button variant="ghost" size="icon" onClick={toggleSidebar}>
             <MenuIcon className="h-5 w-5" />
           </Button> */}
        </div>
        {isExpanded && ( 
          <div className="p-4">
            <Button
              className="w-full justify-start gap-2 bg-green-500 hover:bg-green-600"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Create New
            </Button>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto">
          <ul>
            {menuItems.map((item, index) => (
              item.component ? (
                // Render the component if it exists, passing isExpanded
                React.cloneElement(item.component, { isExpanded: isExpanded, key: item.key || index })
              ) : (
                // Render a regular link if no component
                <li key={item.key || index} className="border-b last:border-b-0">
                  <Link href={item.href} className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 ${!isExpanded ? 'justify-center' : ''}`}> {/* Adjust alignment when collapsed */}
                    {item.icon}
                    {isExpanded && <span>{item.label}</span>} {/* Conditionally render label */}
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
      </aside>

      <CreateNewModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
