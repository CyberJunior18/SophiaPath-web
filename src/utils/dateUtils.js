/**
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

