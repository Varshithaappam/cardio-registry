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
 * Sanitize Percentage Fields (0 to 100 max, up to 3 decimal places like 9.967 or 99.456)
 */
export const sanitizePercentage = (val, maxDecimals = 3) => {
  if (val === '' || val === null || val === undefined) return '';
  let str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  const splitParts = str.split('.');
  if (splitParts[1] && splitParts[1].length > maxDecimals) {
    str = `${splitParts[0]}.${splitParts[1].slice(0, maxDecimals)}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num > 100) return '100';
    if (num < 0) return '0';
  }
  return str;
};

/**
 * Sanitize Decimal values (max 3 decimal places by default, non-negative strictly)
 */
export const sanitizeDecimal = (val, maxDecimals = 3, maxVal = null) => {
  if (val === '' || val === null || val === undefined) return '';
  let str = String(val).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  const splitParts = str.split('.');
  if (splitParts[1] && splitParts[1].length > maxDecimals) {
    str = `${splitParts[0]}.${splitParts[1].slice(0, maxDecimals)}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num < 0) return '0';
    if (maxVal !== null && num > maxVal) {
      return String(maxVal);
    }
  }
  return str;
};

/**
 * Cap any floating point numbers in strings or numbers to max decimal places (default 3)
 */
export const limitDecimalDigits = (val, maxDecimals = 3) => {
  if (val === '' || val === null || val === undefined) return '';
  const regex = new RegExp(`(\\d+\\.\\d{${maxDecimals}})\\d+`, 'g');
  return String(val).replace(regex, '$1');
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

/**
 * Sanitize & Format Monthly Income in Indian Standard Number Format (e.g. 1,00,00,000)
 * Accepts numbers or numeric strings with/without existing commas.
 * Strips non-digits and returns formatted string in Indian numbering format.
 */
export const formatIndianCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  try {
    const num = BigInt(clean);
    return num.toLocaleString('en-IN');
  } catch {
    const num = parseInt(clean, 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
  }
};

/**
 * Sanitize input with a strictly enforced prefix (e.g. 'DDH.', 'DDCH.', 'ACS.').
 * - Preserves the prefix at the beginning.
 * - Extracts and appends only numeric digits [0-9].
 * - Disallows any other letters or characters.
 * - Enforces max length constraint.
 */
/**
 * Sanitize input with a strictly enforced prefix (e.g. 'DDH.', 'DDCH.', 'ACS.').
 * - Preserves the prefix at the beginning.
 * - Extracts and appends only numeric digits [0-9].
 * - Disallows any other letters or characters.
 * - Restricts the number of digits after the dot to maxDigits.
 */
export const sanitizePrefixedCode = (val, prefix, maxDigits = null) => {
  if (val === null || val === undefined || val === '') return prefix;
  const str = String(val).trim();
  if (!str) return prefix;

  let digits = '';
  const lowerPrefix = prefix.toLowerCase();
  const lowerStr = str.toLowerCase();

  if (lowerStr.startsWith(lowerPrefix)) {
    const afterPrefix = str.slice(prefix.length);
    digits = afterPrefix.replace(/\D/g, '');
  } else if (/^\d+$/.test(str)) {
    // If user pasted pure numbers without the prefix
    digits = str;
  } else {
    // String contains non-numeric characters and does not start with prefix (e.g. legacy 'MR00008')
    return prefix;
  }

  if (typeof maxDigits === 'number') {
    digits = digits.slice(0, maxDigits);
  }

  return prefix + digits;
};

/**
 * KeyDown handler for prefixed inputs to:
 * 1. Prevent backspacing or deleting the locked prefix.
 * 2. Prevent entering any letters or symbols other than numeric digits [0-9].
 * 3. Prevent typing more than maxDigits after the prefix.
 */
export const handlePrefixedKeyDown = (e, prefix, maxDigits = null) => {
  // Allow system shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Cmd+...)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Allow navigation and functional keys
  if (['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
    return;
  }

  const input = e.target;
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;

  // Prevent Backspace when caret is at or inside the prefix with no trailing selection
  if (e.key === 'Backspace') {
    if (start <= prefix.length && end <= prefix.length) {
      e.preventDefault();
      input.setSelectionRange(prefix.length, prefix.length);
      return;
    }
  }

  // Prevent Delete key when deleting within the prefix
  if (e.key === 'Delete') {
    if (start < prefix.length && end <= prefix.length) {
      e.preventDefault();
      input.setSelectionRange(prefix.length, prefix.length);
      return;
    }
  }

  // Strictly block any non-digit character (no letters, no symbols, no spaces)
  if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    return;
  }

  // If a digit is typed:
  if (e.key.length === 1 && /^[0-9]$/.test(e.key)) {
    // If caret is placed before/inside the prefix, redirect caret to after the prefix
    if (start < prefix.length && end <= prefix.length) {
      input.setSelectionRange(prefix.length, prefix.length);
    }
    // Prevent typing beyond maxDigits when no text is selected to replace
    if (typeof maxDigits === 'number' && start === end) {
      const currentDigits = (input.value || '').slice(prefix.length).replace(/\D/g, '');
      if (currentDigits.length >= maxDigits) {
        e.preventDefault();
        return;
      }
    }
  }
};

/**
 * Focus / Click handler for prefixed inputs:
 * Automatically positions caret after the prefix if placed before it or when field contains just the prefix.
 */
export const handlePrefixedFocus = (e, prefix) => {
  const input = e.target;
  if (!input) return;
  const pos = input.selectionStart ?? 0;
  if (pos < prefix.length || input.value === prefix) {
    setTimeout(() => {
      if (input.selectionStart < prefix.length || input.value === prefix) {
        input.setSelectionRange(prefix.length, prefix.length);
      }
    }, 0);
  }
};

/**
 * Sanitize MR No input (Strict format: 'DDH.' prefix followed by max 4 numbers only, e.g. DDH.0001)
 */
export const sanitizeMRNo = (val) => {
  if (val === null || val === undefined || val === '') return 'DDH.';
  const str = String(val).trim();
  if (str === 'DDH.0000' || str === '0000' || str.toLowerCase() === 'ddh.') {
    return 'DDH.';
  }
  const result = sanitizePrefixedCode(val, 'DDH.', 4);
  return result === 'DDH.0000' ? 'DDH.' : result;
};

/**
 * Sanitize UHID input (Strict format: 'DDCH.' prefix followed by max 5 numbers only, e.g. DDCH.14250)
 */
export const sanitizeUHID = (val) => {
  if (val === null || val === undefined || val === '') return 'DDCH.';
  const str = String(val).trim();
  if (str === 'DDCH.00000' || str === '00000' || str.toLowerCase() === 'ddch.') {
    return 'DDCH.';
  }
  const result = sanitizePrefixedCode(val, 'DDCH.', 5);
  return result === 'DDCH.00000' ? 'DDCH.' : result;
};

/**
 * Sanitize ACS No input (Strict format: 'ACS.' prefix followed by max 4 numbers only, e.g. ACS.0001)
 */
export const sanitizeACSNo = (val) => {
  if (val === null || val === undefined || val === '') return 'ACS.';
  const str = String(val).trim();
  if (str === 'ACS.0000' || str === '0000' || str.toLowerCase() === 'acs.') {
    return 'ACS.';
  }
  const result = sanitizePrefixedCode(val, 'ACS.', 4);
  return result === 'ACS.0000' ? 'ACS.' : result;
};

/**
 * Sanitize & Format ABHA number (14 digits grouped as XX-XXXX-XXXX-XXXX)
 * Automatically appends hyphens after 2, 6, and 10 digits as the user types
 */
export const sanitizeABHA = (val, prevVal = '') => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  const prevStr = String(prevVal || '');

  // Detect if user pressed backspace on a trailing hyphen or separator
  const isDeleting = prevStr.length > str.length;
  if (isDeleting && (prevStr.endsWith('-') || prevStr.endsWith(' ')) && str === prevStr.slice(0, -1)) {
    str = str.slice(0, -1);
  }

  const digits = str.replace(/\D/g, '').slice(0, 14);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 14));

  let formatted = parts.join('-');

  // Auto-append hyphen when user types the 2nd, 6th, or 10th digit
  if (!isDeleting && (digits.length === 2 || digits.length === 6 || digits.length === 10)) {
    formatted += '-';
  }

  return formatted;
};

/**
 * Sanitize & Format Aadhaar number (12 digits grouped as XXXX XXXX XXXX)
 * Automatically appends spaces after 4 and 8 digits as the user types
 */
export const sanitizeAadhaar = (val, prevVal = '') => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  const prevStr = String(prevVal || '');

  // Detect if user pressed backspace on a trailing space or separator
  const isDeleting = prevStr.length > str.length;
  if (isDeleting && (prevStr.endsWith(' ') || prevStr.endsWith('-')) && str === prevStr.slice(0, -1)) {
    str = str.slice(0, -1);
  }

  const digits = str.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  let formatted = parts.join(' ');

  // Auto-append space when user types the 4th or 8th digit
  if (!isDeleting && (digits.length === 4 || digits.length === 8)) {
    formatted += ' ';
  }

  return formatted;
};

/**
 * Validate ABHA address username (8 to 18 characters, max 1 dot, max 1 underscore, no leading/trailing dot/underscore)
 */
export const validateABHAAddress = (val) => {
  if (!val || typeof val !== 'string') return { valid: false, message: 'ABHA Address is required' };
  const parts = val.trim().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, message: 'Must follow format: username@consent_manager (e.g. username@abdm)' };
  }
  const username = parts[0];
  if (username.length < 8 || username.length > 18) {
    return { valid: false, message: 'Username portion must be between 8 and 18 characters' };
  }
  if (/^[._]|[._]$/.test(username)) {
    return { valid: false, message: 'Username cannot start or end with a dot (.) or underscore (_)' };
  }
  const dotCount = (username.match(/\./g) || []).length;
  const underscoreCount = (username.match(/_/g) || []).length;
  if (dotCount > 1 || underscoreCount > 1) {
    return { valid: false, message: 'Allows at most one dot (.) and/or one underscore (_)' };
  }
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return { valid: false, message: 'Contains invalid special characters' };
  }
  return { valid: true };
};



