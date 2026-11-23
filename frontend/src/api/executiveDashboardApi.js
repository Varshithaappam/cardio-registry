import api from './axiosInstance';

/**
 * Fetch dedicated executive dashboard metrics computed directly from database
 */
export async function fetchExecutiveDashboardMetrics() {
  try {
    const res = await api.get('/executive-dashboard/metrics');
    if (res.data && res.data.success) {
      return res.data;
    }
  } catch (err) {
    console.error('Could not fetch executive dashboard metrics from backend API:', err.message);
  }
  return null;
}
