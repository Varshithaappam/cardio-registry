import api from './axiosInstance';

/**
 * Fetch STEMI cohort directly from backend database API
 */
export async function fetchStemiCohort() {
  try {
    const res = await api.get('/stemi/cohort');
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return {
        source: 'database',
        count: res.data.data.length,
        activeCount: res.data.activeCount ?? res.data.data.length,
        data: res.data.data
      };
    }
  } catch (err) {
    console.error('Could not fetch STEMI cohort from database API:', err.message);
  }

  return {
    source: 'database',
    count: 0,
    activeCount: 0,
    data: []
  };
}

/**
 * Fetch NSTEMI cohort directly from backend database API
 */
export async function fetchNstemiCohort() {
  try {
    const res = await api.get('/nstemi/cohort');
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return {
        source: 'database',
        count: res.data.data.length,
        activeCount: res.data.activeCount ?? res.data.data.length,
        data: res.data.data
      };
    }
  } catch (err) {
    console.error('Could not fetch NSTEMI cohort from database API:', err.message);
  }

  return {
    source: 'database',
    count: 0,
    activeCount: 0,
    data: []
  };
}
