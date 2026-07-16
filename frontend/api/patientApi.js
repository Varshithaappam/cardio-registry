import api from "./axios";

/**
 * Register New Patient
 */
export const createPatient = async (patientData) => {
    const response = await api.post("/patients", patientData);
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