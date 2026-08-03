/**
 * Date Utilities for CARE Registry
 * Bidirectional formatting helpers for DD/MM/YYYY UI display and YYYY-MM-DD MS SQL persistence
 */

/**
 * Converts API / DB date (YYYY-MM-DD or ISO string) to DD/MM/YYYY for display
 */
export const formatDateForDisplay = (isoDate) => {
  if (!isoDate) return '';
  const str = String(isoDate).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  const parts = str.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return str; // Return as-is if parsing fails
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Converts DD/MM/YYYY input string back to YYYY-MM-DD for database payload submission
 */
export const formatDateForDatabase = (dmYDate) => {
  if (!dmYDate) return null;
  const str = String(dmYDate).trim();
  if (!str) return null;

  // If already YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.split('T')[0];
  }
  
  const parts = str.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return str;
};
