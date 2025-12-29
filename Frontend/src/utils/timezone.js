/**
 * Convert match time to user's local timezone
 * API returns times in UK timezone (GMT/BST), convert to user's local time
 * @param {string} date - Date in format YYYY-MM-DD
 * @param {string} time - Time in format HH:MM
 * @returns {object} - { date, time, fullDateTime }
 */
export const convertToLocalTime = (date, time) => {
  if (!date || !time) return { date, time, fullDateTime: null };
  
  // Create date treating time as GMT (UTC+0)
  const gmtDate = new Date(`${date}T${time}:00Z`);
  
  // Get user's timezone offset in minutes
  const userOffset = new Date().getTimezoneOffset();
  
  // Format to local timezone
  const localDate = gmtDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const localTime = gmtDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  console.log(`Converting: ${date} ${time} GMT -> ${localDate} ${localTime} (offset: ${userOffset})`);
  
  return {
    date: localDate,
    time: localTime,
    fullDateTime: gmtDate
  };
};

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @returns {string} - Formatted date
 */
export const formatMatchDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
