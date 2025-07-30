import NepaliDate from 'nepali-date-converter';

/**
 * Validate if a date is within the supported range for NepaliDate
 * @param {Date} adDate JavaScript Date object to validate
 * @returns {boolean} Whether the date is in supported range
 */
function isDateInSupportedRange(adDate) {
  if (!adDate || !(adDate instanceof Date) || isNaN(adDate.getTime())) {
    return false;
  }
  
  const year = adDate.getFullYear();
  // NepaliDate supports dates roughly between 1944-2033 AD (2000-2090 BS)
  return year >= 1944 && year <= 2033;
}

/**
 * Convert an AD (Gregorian) date to BS (Bikram Samvat) date
 * @param {Date} adDate JavaScript Date object to convert
 * @returns {Object} BS date in an object with year, month, date properties
 */
export function convertADtoBS(adDate) {
  try {
    if (!adDate || !(adDate instanceof Date) || isNaN(adDate.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    // Check if the date is in supported range
    if (!isDateInSupportedRange(adDate)) {
      console.warn('Date outside NepaliDate supported range:', adDate.getFullYear());
      // Return with AD date as fallback
      return {
        year: adDate.getFullYear(),
        month: adDate.getMonth(),
        date: adDate.getDate(),
        day: adDate.getDay()
      };
    }
    
    const nepaliDate = new NepaliDate(adDate);
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth(),
      date: nepaliDate.getDate(),
      day: nepaliDate.getDay()
    };
  } catch (error) {
    console.error('Error converting AD to BS date:', error);
    return null;
  }
}

/**
 * Convert a BS (Bikram Samvat) date to AD (Gregorian) date
 * @param {number} year BS year
 * @param {number} month BS month (0-based, 0-11)
 * @param {number} date BS date
 * @returns {Date} JavaScript Date object representing AD date
 */
export function convertBStoAD(year, month, date) {
  try {
    if (
      typeof year !== 'number' || 
      typeof month !== 'number' || 
      typeof date !== 'number' ||
      month < 0 || month > 11 ||
      date < 1 || date > 32
    ) {
      throw new Error('Invalid BS date provided');
    }
    
    // Check if the date is in supported range (2000-2090 BS)
    if (year < 2000 || year > 2090) {
      console.warn('BS Date outside supported range:', year);
      // Return current date as fallback
      return new Date();
    }
    
    const nepaliDate = new NepaliDate(year, month, date);
    return nepaliDate.toJsDate();
  } catch (error) {
    console.error('Error converting BS to AD date:', error);
    return null;
  }
}

/**
 * Format a Date object to BS date string using NepaliDate
 * @param {Date} date JavaScript Date object
 * @param {string} format Format string (YYYY-MM-DD, DD-MM-YYYY, etc.)
 * @param {string} language 'en' for English or 'np' for Nepali numerals
 * @returns {string} Formatted BS date string
 */
export function formatDateBS(date, format = 'YYYY-MM-DD', language = 'en') {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
    
    // Check if the date is in supported range
    if (!isDateInSupportedRange(date)) {
      console.warn('Date outside NepaliDate supported range:', date.getFullYear());
      // Format as regular date as fallback
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
      } else {
        // For other formats, use default formatting
        return date.toLocaleDateString();
      }
    }
    
    const nepaliDate = new NepaliDate(date);
    return nepaliDate.format(format, language);
  } catch (error) {
    console.error('Error formatting date to BS:', error);
    return '';
  }
}

/**
 * Get the current date in BS format
 * @param {string} format Format string
 * @param {string} language 'en' for English or 'np' for Nepali numerals
 * @returns {string} Formatted current BS date
 */
export function getCurrentDateBS(format = 'YYYY-MM-DD', language = 'en') {
  try {
    const today = new Date();
    
    // Check if today is in supported range
    if (!isDateInSupportedRange(today)) {
      console.warn('Current date outside NepaliDate supported range:', today.getFullYear());
      // Format regular date as fallback
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
      } else {
        return today.toLocaleDateString();
      }
    }
    
    const nepaliDate = new NepaliDate();
    return nepaliDate.format(format, language);
  } catch (error) {
    console.error('Error getting current BS date:', error);
    return '';
  }
}

/**
 * Check if the provided date is valid in BS calendar
 * @param {number} year BS year
 * @param {number} month BS month (0-based, 0-11)
 * @param {number} date BS date
 * @returns {boolean} Whether the date is valid
 */
export function isValidBSDate(year, month, date) {
  try {
    if (
      typeof year !== 'number' || 
      typeof month !== 'number' || 
      typeof date !== 'number'
    ) {
      return false;
    }
    
    // Check if the date is in supported range (2000-2090 BS)
    if (year < 2000 || year > 2090) {
      console.warn('BS Date outside supported range:', year);
      return false;
    }
    
    // NepaliDate constructor will throw an error for invalid dates
    new NepaliDate(year, month, date);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Parse a date string into a BS date object
 * @param {string} dateString Date string in supported format (YYYY-MM-DD, etc.)
 * @returns {Object} BS date object with year, month, date properties
 */
export function parseBSDate(dateString) {
  try {
    // Basic validation of date string format
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }
    
    // For YYYY-MM-DD format, check the year range
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const year = parseInt(dateString.substring(0, 4), 10);
      if (year < 2000 || year > 2090) {
        console.warn('BS Date string outside supported range:', year);
        return null;
      }
    }
    
    const nepaliDate = NepaliDate.parse(dateString);
    
    // Validate parsed date
    if (nepaliDate.getYear() < 2000 || nepaliDate.getYear() > 2090) {
      console.warn('Parsed BS date outside supported range:', nepaliDate.getYear());
      return null;
    }
    
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth(),
      date: nepaliDate.getDate(),
      day: nepaliDate.getDay()
    };
  } catch (error) {
    console.error('Error parsing BS date string:', error);
    return null;
  }
}

/**
 * Get the month name in Nepali or English
 * @param {number} month Month index (0-11)
 * @param {string} language 'en' for English or 'np' for Nepali
 * @returns {string} Month name
 */
export function getNepaliMonthName(month, language = 'en') {
  if (month < 0 || month > 11) {
    return '';
  }
  
  const nepaliMonths = {
    en: ['Baishakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 
         'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'],
    np: ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
         'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र']
  };
  
  return nepaliMonths[language][month];
}

/**
 * Get the day name in Nepali or English
 * @param {number} day Day index (0-6, 0 = Sunday)
 * @param {string} language 'en' for English or 'np' for Nepali
 * @returns {string} Day name
 */
export function getNepaliDayName(day, language = 'en') {
  if (day < 0 || day > 6) {
    return '';
  }
  
  const nepaliDays = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    np: ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार']
  };
  
  return nepaliDays[language][day];
}

/**
 * Format a date for display considering the calendar type (Nepali or Gregorian)
 * @param {Date} date JavaScript Date object
 * @param {boolean} isNepaliCalendar Whether to use Nepali calendar
 * @param {string} format Format string for Nepali date
 * @returns {string} Formatted date string
 */
export function formatForDisplay(date, isNepaliCalendar = false, format = 'YYYY-MM-DD') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  if (isNepaliCalendar) {
    return formatDateBS(date, format);
  } else {
    // For AD format, we'll use standard JavaScript date formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Replace with the appropriate format
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  }
} 
