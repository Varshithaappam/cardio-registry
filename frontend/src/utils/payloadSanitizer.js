/**
 * Explicitly strips created_by, updated_by, user_id, and userId from client payloads
 * before sending to server endpoints. Identity is strictly handled via server JWT verification.
 * 
 * @param {Object} payload - The raw payload object from client components
 * @returns {Object} Sanitized payload containing only domain fields
 */
export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized = Array.isArray(payload) ? [...payload] : { ...payload };

  delete sanitized.created_by;
  delete sanitized.updated_by;
  delete sanitized.user_id;
  delete sanitized.userId;

  // Restrict numbers and numeric strings to max 3 decimal places
  for (const key in sanitized) {
    const val = sanitized[key];
    if (typeof val === 'number') {
      const str = String(val);
      if (str.includes('.')) {
        const parts = str.split('.');
        if (parts[1] && parts[1].length > 3) {
          sanitized[key] = parseFloat(`${parts[0]}.${parts[1].slice(0, 3)}`);
        }
      }
    } else if (typeof val === 'string' && /(\d+\.\d{3})\d+/.test(val)) {
      sanitized[key] = val.replace(/(\d+\.\d{3})\d+/g, '$1');
    }
  }

  return sanitized;
}

export default sanitizePayload;
