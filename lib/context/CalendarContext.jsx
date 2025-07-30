"use client"

import { createContext, useState, useContext, useEffect } from 'react';
import NepaliDate from 'nepali-date-converter';

const CalendarContext = createContext();

export function CalendarProvider({ children }) {
  const [isNepaliCalendar, setIsNepaliCalendar] = useState(false);
  const [nepaliLanguage, setNepaliLanguage] = useState('en'); // 'en' for English, 'np' for Nepali

  // Load preferences from localStorage when component mounts (client-side only)
  useEffect(() => {
    const savedCalendarType = localStorage.getItem('calendarType');
    const savedLanguage = localStorage.getItem('nepaliLanguage');
    
    if (savedCalendarType) {
      setIsNepaliCalendar(savedCalendarType === 'BS');
    }
    
    if (savedLanguage) {
      setNepaliLanguage(savedLanguage);
      // Also set the static language for NepaliDate
      if (NepaliDate.language) {
        NepaliDate.language = savedLanguage;
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('calendarType', isNepaliCalendar ? 'BS' : 'AD');
  }, [isNepaliCalendar]);
  
  useEffect(() => {
    localStorage.setItem('nepaliLanguage', nepaliLanguage);
    // Update the static language for NepaliDate
    if (NepaliDate.language) {
      NepaliDate.language = nepaliLanguage;
    }
  }, [nepaliLanguage]);

  const toggleCalendarType = () => {
    setIsNepaliCalendar(prev => !prev);
  };
  
  const toggleNepaliLanguage = () => {
    setNepaliLanguage(prev => prev === 'en' ? 'np' : 'en');
  };
  
  const setNepaliCalendarAndLanguage = (useNepali, language = 'en') => {
    setIsNepaliCalendar(useNepali);
    setNepaliLanguage(language);
  };

  return (
    <CalendarContext.Provider 
      value={{ 
        isNepaliCalendar, 
        nepaliLanguage, 
        toggleCalendarType, 
        toggleNepaliLanguage,
        setNepaliCalendarAndLanguage 
      }}
    >
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
