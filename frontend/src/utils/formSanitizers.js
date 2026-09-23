/**
 * Universal Form Sanitizers & Validators for CARE Health System Forms
 * Enforces real-time input masking, character stripping, format constraints,
 * percentage limits (0-100), max decimal places, and integer bounds.
 */

/**
 * Sanitize Date strings (DD-MM-YYYY or YYYY-MM-DD)
 * Strips non-digits & non-dashes, truncates to 10 characters max
 */
export const sanitizeDate = (val) => {
  if (!val) return '';
  let str = String(val).replace(/[^0-9-/]/g, '');
  if (str.length > 10) str = str.slice(0, 10);
  return str;
};

/**
 * Sanitize Phone Numbers (0-9 only, max 10 digits)
 */
export const sanitizePhone = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 10);
};

/**
 * Sanitize Pincodes (0-9 only, max 6 digits)
 */
export const sanitizePincode = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '').slice(0, 6);
};

/**
 * Sanitize Percentage Fields (0 to 100 max, up to 2 decimal places)
 */
export const sanitizePercentage = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  let str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (parts[1] && parts[1].length > 2) {
    str = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num > 100) {
    return '100';
  }
  return str;
};

/**
 * Sanitize Decimal values (max 2 decimal places)
 */
export const sanitizeDecimal = (val, maxDecimals = 2, maxVal = null) => {
  if (val === '' || val === null || val === undefined) return '';
  let str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (parts[1] && parts[1].length > maxDecimals) {
    str = `${parts[0]}.${parts.slice(0, maxDecimals)}`;
  }
  if (maxVal !== null) {
    const num = parseFloat(str);
    if (!isNaN(num) && num > maxVal) {
      return String(maxVal);
    }
  }
  return str;
};

/**
 * Sanitize Positive Integers (0-9 only, non-negative, max SQL INT size 2,147,483,647)
 */
export const sanitizePositiveInteger = (val, maxVal = 2147483647) => {
  if (val === '' || val === null || val === undefined) return '';
  let clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  if (num < 0) return '0';
  if (num > maxVal) return String(maxVal);
  return String(num);
};

/**
 * Validates text fields (must contain at least 1 alphabetical letter A-Z)
 */
export const validateTextWithChar = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /[a-zA-Z]/.test(val.trim());
};

/**
 * Sanitize Alpha Only fields (A-Z, a-z, and space only)
 * Strips numerical digits and special characters
 */
export const sanitizeAlphaOnly = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[^a-zA-Z\s]/g, '');
};

