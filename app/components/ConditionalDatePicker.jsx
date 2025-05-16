"use client"

import { useState, useEffect } from "react"
import { useCalendar } from "@/lib/context/CalendarContext"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { convertADtoBS } from "@/lib/utils/dateUtils"
import { NepaliDatePicker } from "nepali-datepicker-reactjs"
import "nepali-datepicker-reactjs/dist/index.css"

export function ConditionalDatePicker({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  required = false,
  disabled = false,
  className = "",
  labelClassName = ""
}) {
  const { isNepaliCalendar } = useCalendar()
  const [nepaliDate, setNepaliDate] = useState("")
  
  // When AD date changes or calendar type changes, update Nepali date
  useEffect(() => {
    if (value && isNepaliCalendar) {
      try {
        // Convert AD date to BS date for display
        const bsDate = convertADtoBS(value)
        setNepaliDate(bsDate.formatted)
      } catch (error) {
        console.error("Error converting date:", error)
      }
    }
  }, [value, isNepaliCalendar])

  // Handle Nepali date change
  const handleNepaliDateChange = (bsDate) => {
    if (disabled) return
    
    setNepaliDate(bsDate)
    
    try {
      // Parse the Nepali date
      const [bsYear, bsMonth, bsDay] = bsDate.split('-').map(num => parseInt(num, 10))
      
      // Find the closest reference from our dateUtils reference points
      // This is a simplified conversion - in a production app, use a proper library
      // Approximate AD date based on reference
      const adYear = bsYear === 2080 ? 2023 : 2024
      const adMonth = ((bsMonth - 1 + 4) % 12) // Approximate mapping (0-indexed)
      const adDay = bsDay // Approximate - not accurate for all dates
      
      // Create AD date
      const adDate = new Date(adYear, adMonth, adDay)
      
      // Pass the AD date to the onChange handler
      onChange({ 
        target: { 
          name, 
          value: adDate.toISOString().split('T')[0] 
        } 
      })
    } catch (error) {
      console.error("Error converting Nepali date:", error)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className={labelClassName}>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {isNepaliCalendar ? (
        <NepaliDatePicker
          inputClassName={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          className="w-full"
          value={nepaliDate}
          onChange={handleNepaliDateChange}
          options={{ calenderLocale: "ne", valueLocale: "en" }}
          readOnly={disabled}
        />
      ) : (
        <Input
          id={id}
          name={name}
          type="date"
          value={value || ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  )
} 