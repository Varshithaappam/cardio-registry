/**
 * Date Utilities for CARE Registry
 * Standardized for Indian Local Wall-Clock Time (IST):
 * - Date format: DD-MM-YYYY (e.g. 29-09-2026)
 * - Date & Time format: DD-MM-YYYY, HH:mm (e.g. 29-09-2026, 12:16)
 * - Time format: HH:mm (e.g. 12:16)
 */

export const formatDateForDisplay = (dateVal) => {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return '';

  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str.replace(/\//g, '-');

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

export const formatDateTimeForDisplay = (dateVal) => {
  if (!dateVal) return 'N/A';
  let str = String(dateVal).trim();
  if (!str || str === 'null' || str === 'undefined') return 'N/A';

  // Extract raw date & time components without applying UTC-to-IST offset doubling
  if (str.includes('T') || str.includes(' ')) {
    const cleanStr = str.replace('T', ' ').split('.')[0].replace('Z', '');
    const [datePart, timePart] = cleanStr.split(' ');
    if (datePart && timePart) {
      const dateComponents = datePart.split('-');
      const timeComponents = timePart.split(':');
      if (dateComponents.length === 3 && timeComponents.length >= 2) {
        const [year, month, day] = dateComponents;
        const hour = timeComponents[0].padStart(2, '0');
        const minute = timeComponents[1].padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = month.padStart(2, '0');
        return `${formattedDay}-${formattedMonth}-${year}, ${hour}:${minute}`;
      }
    }
  }

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

export const formatTimeForDisplay = (dateVal) => {
  if (!dateVal) return '';
  let str = String(dateVal).trim();
  if (!str) return '';

  if (str.includes('T') || str.includes(' ')) {
    const cleanStr = str.replace('T', ' ').split('.')[0].replace('Z', '');
    const parts = cleanStr.split(' ');
    const timePart = parts.length > 1 ? parts[1] : parts[0];
    const timeComponents = timePart.split(':');
    if (timeComponents.length >= 2) {
      return `${timeComponents[0].padStart(2, '0')}:${timeComponents[1].padStart(2, '0')}`;
    }
  }

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return '';
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDateForDatabase = (dmYDate) => {
  if (!dmYDate) return null;
  const str = String(dmYDate).trim();
  if (!str) return null;

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

export const formatDate = formatDateForDisplay;
export const formatDateTime = formatDateTimeForDisplay;
export const formatTime = formatTimeForDisplay;
