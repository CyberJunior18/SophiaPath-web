/**
 * Safely parses any date value (Date object, timestamp, ISO string, raw database string)
 * into a valid JavaScript Date object. Handles cross-browser discrepancies (e.g. Safari space-separator issue).
 * 
 * @param {any} dateVal The date value to parse.
 * @returns {Date|null} A valid Date object or null if parsing fails.
 */
export const parseSafeDate = (dateVal) => {
  if (!dateVal) return null;
  
  // If it's already a Date object, check if it's valid
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  
  let d = new Date(dateVal);
  if (!isNaN(d.getTime())) return d;
  
  // Handle space separator instead of 'T' (common in Safari/mobile WebKit)
  if (typeof dateVal === 'string') {
    let sanitized = dateVal.trim();
    sanitized = sanitized.replace(' ', 'T');
    
    // Auto-append Z timezone designator if missing
    if (!sanitized.endsWith('Z') && !sanitized.includes('+') && !sanitized.includes('-')) {
      sanitized += 'Z';
    }
    
    d = new Date(sanitized);
    if (!isNaN(d.getTime())) return d;
  }
  
  return null;
};

/**
 * Safely converts a date value to millisecond epoch time.
 * Returns 0 if parsing fails.
 * 
 * @param {any} dateVal The date value to process.
 * @returns {number} Epoch milliseconds.
 */
export const parseSafeTime = (dateVal) => {
  const d = parseSafeDate(dateVal);
  return d ? d.getTime() : 0;
};

/**
 * Formats a date value to a localized 12-hour time string (e.g., "12:37 PM").
 * 
 * @param {any} dateVal The date value to format.
 * @returns {string} Formatted time string.
 */
export const formatTime = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a date value to a long-form localized date string (e.g., "July 19, 2026").
 * 
 * @param {any} dateVal The date value to format.
 * @returns {string} Formatted date string.
 */
export const formatDate = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Formats a date value exactly like the admin logs: "2026-07-19 20:09:55"
 * Uses ISO format: YYYY-MM-DD HH:MM:SS (24-hour, UTC-normalized).
 * 
 * @param {any} dateVal The date value to format.
 * @returns {string} Formatted log-style date string.
 */
export const formatLog = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d) return '';
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Formats a date value for chat message dividers (e.g., "Today", "Yesterday", "Monday, July 19, 2026").
 * 
 * @param {any} dateVal The date value to format.
 * @returns {string} Divider header string.
 */
export const formatDateDivider = (dateVal) => {
  const d = parseSafeDate(dateVal);
  if (!d) return '';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffTime = today.getTime() - msgDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};
