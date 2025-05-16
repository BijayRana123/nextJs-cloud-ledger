"use client"

import { useCalendar } from "@/lib/context/CalendarContext"
import { formatDate } from "@/lib/utils/dateUtils"

export function DateDisplay({ date, className = "" }) {
  const { isNepaliCalendar } = useCalendar()
  
  // Format the date based on the current calendar type
  const formattedDate = formatDate(date, isNepaliCalendar)
  
  return (
    <span className={className}>
      {formattedDate}
    </span>
  )
}

// Example of how to use in other components:
//
// import { DateDisplay } from "@/app/components/DateDisplay"
//
// function MyComponent() {
//   return (
//     <div>
//       <h2>Transaction Date: <DateDisplay date="2023-10-15" /></h2>
//     </div>
//   )
// } 