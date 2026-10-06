import { useState, useCallback, useRef } from 'react';
import api from '../api/axiosInstance';
import { useAlert } from '../context/AlertContext';

/**
 * Custom React Hook for asynchronous field uniqueness validation
 */
export function useUniqueCheck({ showModalOnDuplicate = false } = {}) {
  const alertCtx = useAlert();
  const showAlert = alertCtx?.showAlert;

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});
  const lastCheckedRef = useRef({});

  /**
   * Helper to display the exact styled Duplicate Record Identifier modal from AlertContext
   */
  const showDuplicateModal = useCallback((fieldKey, label) => {
    if (showAlert) {
      showAlert({
        type: 'warning',
        title: 'Duplicate Record Identifier',
        message: 'A record with this identifier (e.g., ACS No / MR No / IP No) already exists. Please verify the entry.',
        confirmText: 'OK',
        targetField: fieldKey
      });
    }
  }, [showAlert]);

  /**
   * Verify uniqueness of a specific field via GET /api/check-unique
   * @param {string} fieldKey - Local key identifying the field (e.g. 'mr_no', 'uhid', 'ip_no')
   * @param {Object} options
   * @param {string} options.table - Whitelisted table name (e.g. 'patient_registry', 'stemi_registry', 'hf_administrative')
   * @param {string} options.column - Whitelisted column name (e.g. 'mr_no', 'uhid', 'ip_no', 'visit_id')
   * @param {string} options.value - Value entered by user
   * @param {number|string} [options.excludeId] - ID of record being edited (to exclude self)
   * @param {string} [options.label] - Friendly label to display in the error message
   * @param {boolean} [options.showModal] - Whether to show modal popup (defaults to false for onBlur, true for submit)
   * @returns {Promise<boolean>} - true if unique / empty, false if duplicate or failed
   */
  const verifyFieldUnique = useCallback(async (fieldKey, { table, column, value, excludeId, label, showModal = showModalOnDuplicate }) => {
    const trimmedVal = typeof value === 'string' ? value.trim() : (value ? String(value).trim() : '');

    // Blank or empty values are handled by form "required" validation rules, not uniqueness
    if (!trimmedVal) {
      setErrors(prev => {
        if (!prev[fieldKey]) return prev;
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      return true;
    }

    // Cache check to avoid redundant API requests for identical value
    const cacheKey = `${table}:${column}:${trimmedVal}:${excludeId ?? ''}`;
    if (lastCheckedRef.current[fieldKey] === cacheKey && !errors[fieldKey]) {
      return true;
    }

    setLoading(prev => ({ ...prev, [fieldKey]: true }));

    try {
      const response = await api.get('/check-unique', {
        params: {
          table,
          column,
          value: trimmedVal,
          excludeId: excludeId ?? undefined
        }
      });

      const isUnique = response.data?.isUnique;
      lastCheckedRef.current[fieldKey] = cacheKey;

      if (!isUnique) {
        const displayLabel = label || column.replace(/_/g, ' ').toUpperCase();
        setErrors(prev => ({
          ...prev,
          [fieldKey]: `${displayLabel} "${trimmedVal}" already exists in the system.`
        }));

        if (showModal) {
          showDuplicateModal(fieldKey, displayLabel);
        }
        return false;
      } else {
        setErrors(prev => {
          if (!prev[fieldKey]) return prev;
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
        return true;
      }
    } catch (err) {
      console.warn(`Uniqueness validation request for ${fieldKey} failed:`, err.message);
      return true; // Gracefully do not block on network failure if unverified
    } finally {
      setLoading(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, [errors, showModalOnDuplicate, showDuplicateModal]);

  /**
   * Clear error message for a specific field (called in onChange when user modifies input)
   */
  const clearFieldError = useCallback((fieldKey) => {
    delete lastCheckedRef.current[fieldKey];
    setErrors(prev => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const resetErrors = useCallback(() => {
    lastCheckedRef.current = {};
    setErrors({});
    setLoading({});
  }, []);

  const isChecking = Object.values(loading).some(Boolean);
  const hasUniquenessErrors = Object.values(errors).some(Boolean);

  return {
    errors,
    loading,
    isChecking,
    hasUniquenessErrors,
    verifyFieldUnique,
    showDuplicateModal,
    clearFieldError,
    resetErrors,
    setErrors
  };
}

export default useUniqueCheck;
