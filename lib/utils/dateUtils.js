// This is a simplified implementation for Nepali date conversion
// For a production app, you should use a proper Nepali date library like nepali-date-converter

import NepaliDate from 'nepali-date-converter';
import { formatDateBS, formatForDisplay, getNepaliMonthName } from './nepaliDateUtils';

// Nepali months in Nepali language
const nepaliMonths = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'असोज', 
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत्र'
];

// Nepali months in English
const nepaliMonthsInEnglish = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

// Nepali date reference points - each entry contains [bsYear, bsMonth, bsDay, adYear, adMonth, adDay]
// These reference points help with more accurate conversion
const referencePoints = [
  [2080, 1, 1, 2023, 4, 14], // Baishakh 1, 2080 = April 14, 2023
  [2080, 2, 1, 2023, 5, 15], // Jestha 1, 2080 = May 15, 2023
  [2080, 3, 1, 2023, 6, 15], // Ashadh 1, 2080 = June 15, 2023
  [2080, 4, 1, 2023, 7, 17], // Shrawan 1, 2080 = July 17, 2023
  [2080, 5, 1, 2023, 8, 17], // Bhadra 1, 2080 = August 17, 2023
  [2080, 6, 1, 2023, 9, 17], // Ashwin 1, 2080 = September 17, 2023
  [2080, 7, 1, 2023, 10, 18], // Kartik 1, 2080 = October 18, 2023
  [2080, 8, 1, 2023, 11, 17], // Mangsir 1, 2080 = November 17, 2023
  [2080, 9, 1, 2023, 12, 16], // Poush 1, 2080 = December 16, 2023
  [2080, 10, 1, 2024, 1, 15], // Magh 1, 2080 = January 15, 2024
  [2080, 11, 1, 2024, 2, 13], // Falgun 1, 2080 = February 13, 2024
  [2080, 12, 1, 2024, 3, 14], // Chaitra 1, 2080 = March 14, 2024
  [2081, 1, 1, 2024, 4, 13]  // Baishakh 1, 2081 = April 13, 2024
];

// Days in each month of the Nepali calendar for years 2080-2081
const daysInMonthBS = {
  2080: [30, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // Add more years as needed
};

// Function to ensure a date is properly converted to a Date object
function ensureDate(date) {
  if (date instanceof Date) {
    return date;
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    // If it's just YYYY-MM-DD format with no time
    if (date.length === 10 && date.includes('-')) {
      // Create a date with the correct timezone
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Otherwise try parsing it normally
    return new Date(date);
  }
  
  // If a number is provided, treat it as a timestamp
  if (typeof date === 'number') {
    return new Date(date);
  }
  
  // Default to current date
  return new Date();
}

// Convert AD date to BS using NepaliDate library
export function convertADtoBS(date) {
  try {
    // Ensure we have a proper Date object
    const adDate = ensureDate(date);
    
    // Check if date is within valid NepaliDate range (2000-2090 BS)
    // NepaliDate is for dates between 1944-2033 AD (roughly 2000-2090 BS)
    const year = adDate.getFullYear();
    if (year < 1944 || year > 2033) {
      console.warn('Date outside NepaliDate valid range:', year);
      // Return a fallback object with AD date
      return {
        year: year,
        month: adDate.getMonth(),
        day: adDate.getDate(),
        monthName: adDate.toLocaleDateString('en-US', { month: 'long' }),
        monthNameNP: adDate.toLocaleDateString('en-US', { month: 'long' }),
        formatted: adDate.toISOString().split('T')[0],
        formattedNP: adDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      };
    }
    
    // Use NepaliDate for accurate conversion
    const nepaliDate = new NepaliDate(adDate);
    
    // Extract BS date components
    const bsYear = nepaliDate.getYear();
    const bsMonth = nepaliDate.getMonth(); // 0-based index
    const bsDay = nepaliDate.getDate();
    
    // Get month names
    const monthName = nepaliDate.format('MMMM', 'en');
    const monthNameNP = nepaliDate.format('MMMM', 'np');
    
    // Format dates
    const formatted = nepaliDate.format('YYYY-MM-DD');
    const formattedNP = nepaliDate.format('MMMM DD, YYYY');
    
    return {
      year: bsYear,
      month: bsMonth,
      day: bsDay,
      monthName: monthName,
      monthNameNP: monthNameNP,
      formatted: formatted,
      formattedNP: formattedNP
    };
  } catch (error) {
    console.error('Error converting AD to BS date:', error);
    // Return a fallback object with current date in case of error
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      monthName: 'Unknown',
      monthNameNP: 'Unknown',
      formatted: now.toISOString().split('T')[0],
      formattedNP: now.toLocaleDateString('en-US')
    };
  }
}

// Format date based on calendar type
export function formatDate(date, isNepaliCalendar = false, nepaliLanguage = 'en') {
  const adDate = ensureDate(date);
  
  // Get AD formatted date as fallback
  const adFormatted = adDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (isNepaliCalendar) {
    try {
      // Check if date is within valid NepaliDate range (2000-2090 BS)
      // NepaliDate is for dates between 1944-2033 AD (roughly 2000-2090 BS)
      const year = adDate.getFullYear();
      if (year < 1944 || year > 2033) {
        console.warn('Date outside NepaliDate valid range:', year);
        return adFormatted;
      }
      
      return new NepaliDate(adDate).format('MMMM DD, YYYY', nepaliLanguage);
    } catch (error) {
      console.error('Error formatting BS date:', error);
      return adFormatted;
    }
  } else {
    return adFormatted;
  }
}

// Get current date formatted according to calendar type
export function getCurrentDate(isNepaliCalendar = false, nepaliLanguage = 'en') {
  return formatDate(new Date(), isNepaliCalendar, nepaliLanguage);
}

// Format date for input fields (YYYY-MM-DD)
export function formatDateForInput(date, isNepaliCalendar = false, nepaliLanguage = 'en') {
  if (!date) return "";
  
  const d = ensureDate(date);
  
  // Always have a fallback format ready
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const adFormatted = `${year}-${month}-${day}`;
  
  if (isNepaliCalendar) {
    try {
      // Check if date is within valid NepaliDate range (2000-2090 BS)
      // NepaliDate is for dates between 1944-2033 AD (roughly 2000-2090 BS)
      if (year < 1944 || year > 2033) {
        console.warn('Date outside NepaliDate valid range:', year);
        return adFormatted;
      }
      
      return new NepaliDate(d).format('YYYY-MM-DD', nepaliLanguage);
    } catch (error) {
      console.error('Error formatting BS date for input:', error);
      return adFormatted;
    }
  } else {
    return adFormatted;
  }
} 
