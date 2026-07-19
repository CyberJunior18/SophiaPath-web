/**
<<<<<<< HEAD
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
=======
 * Safely format a timestamp/date to a time string.
 * @param {any} timestamp - The raw timestamp or date string/object.
 * @param {object} options - Format options for toLocaleTimeString.
 * @param {string} fallback - The value to return if the date is invalid.
 * @returns {string} The formatted time string or fallback.
 */
export const safeFormatTime = (timestamp, options = { hour: '2-digit', minute: '2-digit' }, fallback = '') => {
  if (!timestamp || timestamp === 'null' || timestamp === 'undefined') return fallback;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString([], options);
};

/**
 * Safely format a timestamp/date to a date string.
 * @param {any} timestamp - The raw timestamp or date string/object.
 * @param {object} options - Format options for toLocaleDateString.
 * @param {string} fallback - The value to return if the date is invalid.
 * @returns {string} The formatted date string or fallback.
 */
export const safeFormatDate = (timestamp, options = {}, fallback = '') => {
  if (!timestamp || timestamp === 'null' || timestamp === 'undefined') return fallback;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return fallback;
  if (Object.keys(options).length === 0) {
    return date.toLocaleDateString();
  }
  return date.toLocaleDateString(undefined, options);
};

/**
 * Check if two timestamps/dates represent the same day.
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Format a timestamp for centered chat date separators.
 */
export const formatChatSeparatorDate = (timestamp) => {
  if (!timestamp || timestamp === 'null' || timestamp === 'undefined') return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};

/**
 * Format the last message time/date for the chat list.
 */
export const formatLastMessageTime = (timestamp) => {
  if (!timestamp || timestamp === 'null' || timestamp === 'undefined') return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (isSameDay(date, today)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    const options = date.getFullYear() === today.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
};

>>>>>>> 9e854a82ba11ca21277a5e9b9cb93c1bf6d165bf
