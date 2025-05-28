"use client";

import React from 'react';

export function CustomTable({ children , className }) {
  return (
    <div className={`relative w-full overflow-x-auto ${className || ''}`}>
      <table className="w-full caption-bottom text-sm">
        {children || ''}
      </table>
    </div>
  );
}

export function CustomTableHeader({ children, className }) {
  return (
    <thead className={`[&_tr]:border-b ${className || ''}`}>
      {children || ''}
    </thead>
  );
}

export function CustomTableBody({ children , className }) {
  return (
    <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`}>
      {children || ''}
    </tbody>
  );
}

export function CustomTableRow({ children, className, onClick }) {
  // Ensure children is an array and filter out any text nodes that are just whitespace
  const filteredChildren = React.Children.toArray(children).filter(child => 
    typeof child !== 'string' || child.trim() !== ''
  );
  
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`}
      onClick={onClick}
    >
      {filteredChildren}
    </tr>
  );
}

export function CustomTableHead({ children, className }) {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`}>
      {children || ''}
    </th>
  );
}

export function CustomTableCell({ children , className }) {
  return (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}>
      {children || ''}
    </td>
  );
}
