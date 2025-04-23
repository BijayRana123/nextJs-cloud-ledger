"use client"

import { CreateNewItem } from "./create-new-item"

export function CreateNewCategory({ title, items, onItemClick }) {
  return (
    <div className="p-6 border-r last:border-r-0">
      <h3 className="font-medium text-gray-500 mb-6">{title}</h3>
      <div className="space-y-6">
        {items.map((item, index) => (
          <CreateNewItem key={index} label={item} onClick={() => onItemClick(title, item)} />
        ))}
      </div>
    </div>
  )
}
