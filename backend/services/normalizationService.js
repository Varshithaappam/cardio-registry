const crypto = require('crypto');
const { doubleMetaphone } = require('double-metaphone');

/**
 * Honorific prefixes to strip during name normalization
 */
const HONORIFIC_REGEX = /\b(dr|doctor|mr|mrs|ms|smt|shri|sri|prof|professor|master|fr|father|sister|sr|er|adv)\b\.?/gi;

/**
 * Normalizes a full name:
 * - Unicode NFKC normalization
 * - Lowercase
 * - Strip medical & social honorifics (Dr, Mr, Mrs, Smt, Shri, etc.)
 * - Remove special characters / punctuation
 * - Collapse consecutive whitespace
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';

  let normalized = name.normalize('NFKC').toLowerCase();

  // Strip honorifics
  normalized = normalized.replace(HONORIFIC_REGEX, ' ');

  // Remove punctuation and non-alphanumeric except spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Computes phonetic encoding for a normalized name using Double-Metaphone
 */
function getPhonetic(name) {
  const norm = normalizeName(name);
  if (!norm) return null;

  const parts = norm.split(' ');
  const codes = [];

  for (const part of parts) {
    if (part.length >= 2) {
      const [primary] = doubleMetaphone(part);
      if (primary) {
        codes.push(primary);
      }
    }
  }

  return codes.length > 0 ? codes.join(' ').substring(0, 50) : null;
}

/**
 * Computes classic Soundex (4 chars) as a fallback
 */
function getSoundex(name) {
  const norm = normalizeName(name);
  if (!norm) return null;

  const word = norm.replace(/[^a-z]/g, '');
  if (!word) return null;

  const mapping = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6'
  };

  const firstChar = word[0].toUpperCase();
  let codes = firstChar;
  let prevCode = mapping[word[0]] || '';

  for (let i = 1; i < word.length && codes.length < 4; i++) {
    const char = word[i];
    const code = mapping[char] || '';
    if (code && code !== prevCode) {
      codes += code;
      prevCode = code;
    } else if (!code) {
      prevCode = '';
    }
  }

  return codes.padEnd(4, '0').substring(0, 4);
}

/**
 * Normalizes a phone number to standard international E.164 format:
 * - Strips non-digit chars (except leading +)
 * - Auto-detects 10-digit Indian numbers and prefixes +91
 * - Formats 12-digit Indian numbers starting with 91 as +91...
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';

  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '+91' + cleaned.substring(1);
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Normalizes email address
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const cleaned = email.trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normalizes strong identifiers (ABHA, UHID):
 * - Removes hyphens, spaces, dots, slashes
 * - Converts to uppercase
 */
function normalizeIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const cleaned = identifier.trim().replace(/[\s\-_./\\:]/g, '').toUpperCase();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Extracts 6-digit Indian PIN code via regex
 */
function extractPincode(address, explicitPincode) {
  if (explicitPincode && typeof explicitPincode === 'string') {
    const cleanPin = explicitPincode.trim().replace(/\D/g, '');
    if (/^[1-9]\d{5}$/.test(cleanPin)) {
      return cleanPin;
    }
  }

  if (address && typeof address === 'string') {
    const pinMatch = address.match(/(?<!\d)([1-9]\d{5})(?!\d)/);
    if (pinMatch) {
      return pinMatch[1];
    }
  }

  return null;
}

/**
 * Normalizes address string:
 * - Combines structured parts if present
 * - Lowercases, standardizes common road/locality abbreviations
 * - Removes punctuation
 */
function normalizeAddress(address, components = {}) {
  let raw = address || '';

  if (typeof components === 'object' && components !== null) {
    const parts = [
      components.house_flat_no,
      components.street_locality,
      components.village_town,
      components.mandal,
      components.district,
      components.state,
      components.pincode
    ].filter(Boolean);

    if (parts.length > 0) {
      raw = parts.join(' ');
    }
  }

  if (!raw || typeof raw !== 'string') return '';

  let normalized = raw.normalize('NFKC').toLowerCase();

  // Normalize common address terms
  normalized = normalized
    .replace(/\brd\b/g, 'road')
    .replace(/\bst\b/g, 'street')
    .replace(/\bapt\b/g, 'apartment')
    .replace(/\bflt\b/g, 'flat')
    .replace(/\bno\b\.?/g, 'number')
    .replace(/\bcol\b/g, 'colony')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Computes SHA-256 hex string (64 characters)
 */
function sha256(val) {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  return crypto.createHash('sha256').update(val.trim()).digest('hex');
}

/**
 * Masks phone number for safe display (e.g. ******3210 or +91******3210)
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  const last4 = digits.substring(digits.length - 4);
  return `******${last4}`;
}

/**
 * Masks email address for safe display (e.g. r******r@hospital.org)
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '******';
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0] || ''}***@${domain}`;
  }
  return `${user[0]}******${user[user.length - 1]}@${domain}`;
}

module.exports = {
  normalizeName,
  getPhonetic,
  getSoundex,
  normalizePhone,
  normalizeEmail,
  normalizeIdentifier,
  extractPincode,
  normalizeAddress,
  sha256,
  maskPhone,
  maskEmail
};
