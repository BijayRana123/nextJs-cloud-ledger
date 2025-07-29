"use client"

import { useState, useEffect } from "react"
import { useCalendar } from "@/lib/context/CalendarContext"
import { Label } from "../../components/ui/label"
import { Input } from "@/components/ui/input"
import { convertADtoBS, formatDateForInput } from "@/lib/utils/dateUtils"
import { NepaliDatePicker } from "nepali-datepicker-reactjs"
import "nepali-datepicker-reactjs/dist/index.css"
import NepaliDate from "nepali-date-converter"

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
  const { isNepaliCalendar, nepaliLanguage } = useCalendar()
  const [nepaliDate, setNepaliDate] = useState("")
  
  // When AD date changes or calendar type changes, update Nepali date
  useEffect(() => {
    if (value && isNepaliCalendar) {
      try {
        // Format AD date as BS date using Nepali-Date library
        const formattedBsDate = formatDateForInput(value, true, nepaliLanguage);
        setNepaliDate(formattedBsDate);
      } catch (error) {
        console.error("Error converting date:", error)
      }
    }
  }, [value, isNepaliCalendar, nepaliLanguage])

  // Handle Nepali date change
  const handleNepaliDateChange = (bsDate) => {
    if (disabled) return
    
    setNepaliDate(bsDate)
    
    try {
      // Parse the Nepali date
      const [bsYear, bsMonth, bsDay] = bsDate.split('-').map(num => parseInt(num, 10))
      
      // Validate BS date range (2000-2090 BS / 1944-2033 AD)
      if (bsYear < 2000 || bsYear > 2090) {
        console.warn('Date outside valid NepaliDate range:', bsYear);
        // Handle the error gracefully
        return;
      }
      
      // Convert BS date to AD date using NepaliDate library
      const nepaliDate = new NepaliDate(bsYear, bsMonth - 1, bsDay); // Month is 0-indexed in NepaliDate
      const adDate = nepaliDate.toJsDate();
      
      // Format AD date for input (YYYY-MM-DD)
      const adDateStr = adDate.toISOString().split('T')[0];
      
      // Pass the AD date to the onChange handler
      onChange({ 
        target: { 
          name, 
          value: adDateStr
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
          options={{ calenderLocale: nepaliLanguage === 'np' ? "ne" : "en", valueLocale: "en" }}
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