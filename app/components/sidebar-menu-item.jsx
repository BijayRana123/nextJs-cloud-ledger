"use client"

import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"

export function SidebarMenuItem({
  icon,
  label,
  href,
  hasSubmenu,
  submenu,
  isExpanded,
  onToggle,
  activeSubmenuIndex = -1,
}) {
  return (
    <li className="border-b last:border-b-0">
      {hasSubmenu ? (
        <div>
          <button
            className={`flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${isExpanded ? "bg-gray-100" : ""}`}
            onClick={onToggle}
          >
            <div className="flex items-center gap-3">
              {icon}
              <span>{label}</span>
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isExpanded && (
            <ul className="bg-gray-50">
              {submenu.map((subItem, subIndex) => (
                <li key={subIndex}>
                  <Link
                    href={subItem.href}
                    className={`flex items-center justify-between px-4 py-3 pl-12 text-gray-700 hover:bg-gray-100 ${subIndex === activeSubmenuIndex ? "bg-blue-50" : ""}`}
                  >
                    <span>{subItem.label}</span>
                    {subItem.icon}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100">
          {icon}
          <span>{label}</span>
        </Link>
      )}
    </li>
  )
}
