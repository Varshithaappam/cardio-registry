import api from './axiosInstance';
import { evaluatePatientAdherence } from '../utils/gdmtEngine';

/**
 * Fetch patient cohort directly from our MSSQL database API.
 */
export async function fetchGdmtCohort() {
  const res = await api.get('/patients/gdmt-cohort?source=database');
  if (res.data && res.data.success && Array.isArray(res.data.data)) {
    return {
      source: 'database',
      data: res.data.data.map(evaluatePatientAdherence),
      analytics: res.data.analytics
    };
  }
  throw new Error('Unable to retrieve patient data from database.');
}
