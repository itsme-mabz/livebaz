/**
 * Convert match time to user's selected timezone or local timezone
 * API returns times in UK timezone (GMT/BST), convert to user's selected time
 * @param {string} date - Date in format YYYY-MM-DD
 * @param {string} time - Time in format HH:MM
 * @param {string} timeZone - Timezone string (e.g., 'UTC+05:00', 'auto')
 * @returns {object} - { date, time, fullDateTime }
 */
export const convertToLocalTime = (date, time, timeZone) => {
  if (!date || !time) return { date, time, fullDateTime: null };

  // Create date treating time as GMT (UTC+0)
  const gmtDate = new Date(`${date}T${time}:00Z`);

  // If timezone is 'auto', use browser's local timezone
  if (!timeZone || timeZone === 'auto') {
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

    return { date: localDate, time: localTime, fullDateTime: gmtDate };
  }

  // Handle UTC offset format (e.g., 'UTC+05:00', 'UTC-03:30')
  if (timeZone.startsWith('UTC')) {
    const offsetStr = timeZone.replace('UTC', '');
    const sign = offsetStr[0] === '-' ? -1 : 1;
    const [hours, minutes] = offsetStr.substring(1).split(':').map(Number);
    const offsetMinutes = sign * (hours * 60 + (minutes || 0));

    // Apply offset to GMT time
    const targetDate = new Date(gmtDate.getTime() + offsetMinutes * 60000);

    const localDate = targetDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });

    const localTime = targetDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });

    return { date: localDate, time: localTime, fullDateTime: gmtDate };
  }

  // Fallback to auto
  return convertToLocalTime(date, time, 'auto');
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
