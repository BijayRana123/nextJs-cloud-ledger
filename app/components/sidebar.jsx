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
  Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateNewModal } from "./create-new-modal";
import { SalesMenu } from "./SalesMenu";
import { PurchaseMenu } from "./PurchaseMenu";
import { AccountingMenu } from "./AccountingMenu";
import { ReportsMenu } from "./ReportsMenu";

// SidebarCreateNewMenu: Submenu for Create New icon in collapsed sidebar
function SidebarCreateNewMenu({ onNavigate }) {
  const router = require('next/navigation').useRouter();
  const categories = [
    {
      title: "GENERAL",
      items: ["Customer", "Supplier", "Products", "Accounts"],
    },
    {
      title: "SALES",
      items: ["Sales Voucher", "Sales Return"],
    },
    {
      title: "PURCHASE",
      items: ["Purchase Voucher", "Purchase Return"],
    },
    {
      title: "ACCOUNTING",
      items: ["Journal Voucher", "Contra Voucher", "Receipt Voucher", "Payment Voucher"],
    },
  ];
  const routeMap = {
    'Customer': '/dashboard',
    'Supplier': '/dashboard',
    'Products': '/dashboard',
    'Accounts': '/dashboard/accounting/ledger',
    'Sales Voucher': '/dashboard/sales/add-sales-voucher',
    'Sales Return': '/dashboard/sales/add-sales-return',
    'Purchase Voucher': '/dashboard/purchase/add-purchase-bill',
    'Purchase Return': '/dashboard/purchase/add-purchase-return',
    'Journal Voucher': '/dashboard/accounting/journal-entries/new',
    'Contra Voucher': '/dashboard/accounting/transactions/contra-voucher/new',
    'Receipt Voucher': '/dashboard/accounting/transactions/receive-payment/new',
    'Payment Voucher': '/dashboard/accounting/transactions/pay-supplier/new',
  };
  const handleClick = (item) => {
    const route = routeMap[item];
    if (route) {
      router.push(route);
      if (onNavigate) onNavigate();
    }
  };
  return (
    <div className="p-4">
      {categories.map((category, idx) => (
        <div key={idx} className="mb-2">
          <div className="font-semibold text-gray-700 mb-2 uppercase text-xs">{category.title}</div>
          <ul className="space-y-1">
            {category.items.map((item, i) => (
              <li key={i}>
                <button
                  className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-gray-700 text-sm"
                  onClick={() => handleClick(item)}
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [accountsOpen, setAccountsOpen] = useState(false);

  useEffect(() => {
    // Determine expanded state based on the current route
    // Set expanded state to true for consistency across pages
    setIsExpanded(true);
  }, [pathname]);


  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      href: "/dashboard",
    },
    // Replace Sales menu with SalesMenu component, pass isExpanded prop
    { component: <SalesMenu key="sales" isExpanded={isExpanded} /> },
    // Replace Purchase menu with PurchaseMenu component, pass isExpanded prop
    { component: <PurchaseMenu key="purchase" isExpanded={isExpanded} /> },
    // Replace Accounting menu with AccountingMenu component, pass isExpanded prop
    { component: <AccountingMenu key="accounting" isExpanded={isExpanded} /> },
    // --- Insert Accounts menu here ---
    {
      key: "accounts",
      isCustom: true,
      render: ({ key }) => (
        <li key={key} className="border-b last:border-b-0">
          <button
            className={`flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 ${!isExpanded ? 'justify-center' : ''}`}
            onClick={() => setAccountsOpen((open) => !open)}
            aria-expanded={accountsOpen}
            aria-controls="accounts-submenu"
          >
            <Book className="h-5 w-5" />
            {isExpanded && <span>Accounts</span>}
            {isExpanded && (
              <span className="ml-auto">{accountsOpen ? '▾' : '▸'}</span>
            )}
          </button>
          {/* Sub-menu */}
          {isExpanded && accountsOpen && (
            <ul id="accounts-submenu" className="ml-8 mt-1 space-y-1">
              <li>
                <Link href="/dashboard/accounting/ledger-group" className="block px-2 py-1 text-gray-700 hover:bg-gray-200 rounded">
                  Ledger Group
                </Link>
              </li>
              <li>
                <Link href="/dashboard/accounting/ledger" className="block px-2 py-1 text-gray-700 hover:bg-gray-200 rounded">
                  Ledgers
                </Link>
              </li>
              <li>
                <Link href="/dashboard/accounting/chart-of-accounts" className="block px-2 py-1 text-gray-700 hover:bg-gray-200 rounded">
                  Chart of Accounts
                </Link>
              </li>
            </ul>
          )}
        </li>
      ),
    },
    // --- End Accounts menu ---
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
        {/* Always show Create New icon at the top */}
        <div className="relative flex flex-col items-center">
          <div className="group w-full flex justify-center">
            <Button
              className={`my-2 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 p-0 ${isExpanded ? 'hidden' : ''}`}
              size="icon"
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Create New"
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
            {/* Submenu for collapsed sidebar, show on hover */}
            {!isExpanded && (
              <div className="absolute left-full top-0 z-50 w-72 bg-white border rounded-md shadow-lg hidden group-hover:block">
                <SidebarCreateNewMenu onNavigate={() => setIsCreateModalOpen(false)} />
              </div>
            )}
          </div>
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
              item.isCustom
                ? item.render({ key: item.key || index })
                : item.component
                  ? React.cloneElement(item.component, { isExpanded: isExpanded, key: item.key || index })
                  : (
                    <li key={item.key || index} className="border-b last:border-b-0">
                      <Link href={item.href} className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 ${!isExpanded ? 'justify-center' : ''}`}>
                        {item.icon}
                        {isExpanded && <span>{item.label}</span>}
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
