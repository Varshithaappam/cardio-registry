/**
 * Explicitly strips created_by, updated_by, user_id, and userId from client payloads
 * before sending to server endpoints. Identity is strictly handled via server JWT verification.
 * 
 * @param {Object} payload - The raw payload object from client components
 * @returns {Object} Sanitized payload containing only domain fields
 */
export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized = { ...payload };

  delete sanitized.created_by;
  delete sanitized.updated_by;
  delete sanitized.user_id;
  delete sanitized.userId;

  return sanitized;
}

export default sanitizePayload;
