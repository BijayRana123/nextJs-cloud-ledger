"use client"

import { Plus } from "lucide-react"

export function CreateNewItem({ label, onClick }) {
  return (
    <button
      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 w-full text-left py-2"
      onClick={onClick}
    >
      <Plus className="h-4 w-4 text-gray-400" />
      <span>{label}</span>
    </button>
  )
}
