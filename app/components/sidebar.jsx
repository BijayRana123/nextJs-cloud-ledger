"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Home, Users, Workflow, ShoppingCart, DollarSign, BarChart2, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateNewModal } from "./create-new-modal"

export function Sidebar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const menuItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", href: "#" },
    { icon: <Users className="h-5 w-5" />, label: "CRM", href: "#" },
    { icon: <Workflow className="h-5 w-5" />, label: "Workflow", href: "#" },
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Sales", href: "#" },
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Purchase", href: "#" },
    { icon: <DollarSign className="h-5 w-5" />, label: "Accounting", href: "#" },
    { icon: <Package className="h-5 w-5" />, label: "Inventory", href: "#" },
    { icon: <BarChart2 className="h-5 w-5" />, label: "Reports", href: "#" },
    { icon: <Settings className="h-5 w-5" />, label: "Configurations", href: "#" },
  ]

  return (
    <>
      <aside className="hidden md:flex w-60 flex-col border-r bg-white">
        <div className="p-4">
          <Button
            className="w-full justify-start gap-2 bg-green-500 hover:bg-green-600"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Create New
          </Button>
        </div>
        <nav className="flex-1">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link href={item.href} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <CreateNewModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  )
}
