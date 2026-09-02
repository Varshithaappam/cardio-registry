import api from "./axios";

/**
 * Verify Patient Identity (Pre-registration Deduplication Check)
 */
export const verifyPatient = async (patientData) => {
    const response = await api.post("/patients/verify", patientData);
    return response.data;
};

/**
 * Resolve unverified staging intake (FORCE_CREATE or MERGE)
 */
export const resolveStagingPatient = async ({ staging_id, action, target_patient_id }) => {
    const response = await api.post("/resolve-staging", { staging_id, action, target_patient_id });
    return response.data;
};

/**
 * Register New Patient
 */
export const createPatient = async (patientData, options = {}) => {
    const params = {};
    if (options.confirm_no_existing_match) {
        params.confirm_no_existing_match = 'true';
    }
    const response = await api.post("/patients", patientData, { params });
    return response.data;
};

/**
 * Confirm Match with an Existing Patient
 */
export const confirmPatientMatch = async (matchData) => {
    const response = await api.post("/patients/confirm-match", matchData);
    return response.data;
};

/**
 * Reject Match (Mark candidate as distinct person)
 */
export const rejectPatientMatch = async (matchData) => {
    const response = await api.post("/patients/reject-match", matchData);
    return response.data;
};

/**
 * Get Identity Matching Audit Trail
 */
export const getPatientAudit = async (params = {}) => {
    const response = await api.get("/patients/audit", { params });
    return response.data;
};

/**
 * Get All Patients
 */
export const getAllPatients = async () => {
    const response = await api.get("/patients");
    return response.data;
};

/**
 * Get Patient By ID
 */
export const getPatientById = async (patientId) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
};

/**
 * Update Patient
 */
export const updatePatient = async (patientId, patientData) => {
    const response = await api.put(`/patients/${patientId}`, patientData);
    return response.data;
};

/**
 * Delete Patient
 */
export const deletePatient = async (patientId) => {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
};