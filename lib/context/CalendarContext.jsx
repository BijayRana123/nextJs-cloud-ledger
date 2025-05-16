"use client"

import { createContext, useState, useContext, useEffect } from 'react';

const CalendarContext = createContext();

export function CalendarProvider({ children }) {
  const [isNepaliCalendar, setIsNepaliCalendar] = useState(false);

  // Load preference from localStorage when component mounts (client-side only)
  useEffect(() => {
    const savedPreference = localStorage.getItem('calendarType');
    if (savedPreference) {
      setIsNepaliCalendar(savedPreference === 'BS');
    }
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('calendarType', isNepaliCalendar ? 'BS' : 'AD');
  }, [isNepaliCalendar]);

  const toggleCalendarType = () => {
    setIsNepaliCalendar(prev => !prev);
  };

  return (
    <CalendarContext.Provider value={{ isNepaliCalendar, toggleCalendarType }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
} 