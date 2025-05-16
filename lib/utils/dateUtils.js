// This is a simplified implementation for Nepali date conversion
// For a production app, you should use a proper Nepali date library like nepali-date-converter

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

// Improved function to convert AD date to BS
export function convertADtoBS(date) {
  // Ensure we have a proper Date object
  const adDate = ensureDate(date);
  
  // Extract AD date components
  const adYear = adDate.getFullYear();
  const adMonth = adDate.getMonth() + 1; // Make 1-indexed
  const adDay = adDate.getDate();
  
  // Find the closest reference point that's before or equal to the given date
  let closestRefIndex = -1;
  let minDiff = Infinity;
  
  for (let i = 0; i < referencePoints.length; i++) {
    const [_, __, ___, refAdYear, refAdMonth, refAdDay] = referencePoints[i];
    
    // Calculate the difference in days (approximate)
    const adDateValue = adYear * 365 + adMonth * 30 + adDay;
    const refDateValue = refAdYear * 365 + refAdMonth * 30 + refAdDay;
    const diff = adDateValue - refDateValue;
    
    // Find the closest reference point that's not in the future
    if (diff >= 0 && diff < minDiff) {
      minDiff = diff;
      closestRefIndex = i;
    }
  }
  
  // If no reference point is found, use the last one (and add days)
  if (closestRefIndex === -1) {
    closestRefIndex = referencePoints.length - 1;
  }
  
  // Get the reference point
  const [refBsYear, refBsMonth, refBsDay, refAdYear, refAdMonth, refAdDay] = referencePoints[closestRefIndex];
  
  // Calculate the difference in days
  const adDateTime = new Date(adYear, adMonth - 1, adDay).getTime();
  const refAdDateTime = new Date(refAdYear, refAdMonth - 1, refAdDay).getTime();
  const diffDays = Math.round((adDateTime - refAdDateTime) / (24 * 60 * 60 * 1000));
  
  // Calculate BS date
  let bsYear = refBsYear;
  let bsMonth = refBsMonth;
  let bsDay = refBsDay + diffDays;
  
  // Adjust if bsDay exceeds the days in the month
  while (bsDay > daysInMonthBS[bsYear][bsMonth - 1]) {
    bsDay -= daysInMonthBS[bsYear][bsMonth - 1];
    bsMonth++;
    
    if (bsMonth > 12) {
      bsMonth = 1;
      bsYear++;
      // If we don't have data for this year, use approximation
      if (!daysInMonthBS[bsYear]) {
        daysInMonthBS[bsYear] = daysInMonthBS[bsYear - 1];
      }
    }
  }
  
  // Convert to 0-based index for arrays
  const bsMonthIndex = bsMonth - 1;
  
  return {
    year: bsYear,
    month: bsMonthIndex,
    day: bsDay,
    monthName: nepaliMonthsInEnglish[bsMonthIndex],
    monthNameNP: nepaliMonths[bsMonthIndex],
    formatted: `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`, // YYYY-MM-DD format
    formattedNP: `${nepaliMonthsInEnglish[bsMonthIndex]} ${bsDay}, ${bsYear}` // Month Day, Year format
  };
}

// Format date based on calendar type
export function formatDate(date, isNepaliCalendar = false) {
  if (isNepaliCalendar) {
    const bsDate = convertADtoBS(date);
    return bsDate.formattedNP;
  } else {
    const adDate = ensureDate(date);
    return adDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// Get current date formatted according to calendar type
export function getCurrentDate(isNepaliCalendar = false) {
  return formatDate(new Date(), isNepaliCalendar);
} 