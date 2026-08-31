/**
 * Date Utilities for CARE Registry
 * Standardized for Indian Locale:
 * - Date format: DD-MM-YYYY (e.g. 27-08-2026)
 * - Date & Time format: DD-MM-YYYY, HH:mm (e.g. 27-08-2026, 15:09)
 * - Time format: HH:mm (e.g. 15:09)
 */

/**
 * Converts a date value (Date, ISO string, or timestamp) to DD-MM-YYYY
 */
export const formatDateForDisplay = (dateVal) => {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return '';

  // If already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  // If DD/MM/YYYY, convert to DD-MM-YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str.replace(/\//g, '-');

  // Handle YYYY-MM-DD
  const datePart = str.includes('T') ? str.split('T')[0] : (str.includes(' ') ? str.split(' ')[0] : str);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return str;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Converts a date value (Date, ISO string, or timestamp) to Indian Date & Time format:
 * e.g. "27-08-2026, 15:09"
 */
export const formatDateTimeForDisplay = (dateVal) => {
  if (!dateVal) return 'N/A';
  const str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return 'N/A';

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) {
    return formatDateForDisplay(str);
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year}, ${hours}:${minutes}`;
};

/**
 * Converts a date value to 24-hr Indian time: HH:mm (e.g. 15:09)
 */
export const formatTimeForDisplay = (dateVal) => {
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  if (isNaN(dateObj.getTime())) return '';
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Converts DD-MM-YYYY or DD/MM/YYYY input string back to YYYY-MM-DD for database payload submission
 */
export const formatDateForDatabase = (dmYDate) => {
  if (!dmYDate) return null;
  const str = String(dmYDate).trim();
  if (!str) return null;

  // If already YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.split('T')[0].split(' ')[0];
  }
  
  const sep = str.includes('-') ? '-' : '/';
  const parts = str.split(sep);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return str;
};

// Aliases for convenience
export const formatDate = formatDateForDisplay;
export const formatDateTime = formatDateTimeForDisplay;
export const formatTime = formatTimeForDisplay;
