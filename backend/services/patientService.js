const patientModel = require("../models/patientModel");
const { normalizePatientInput } = require("../utils/patientValidation");

/**
 * Generate MR Number
 * Format: MR00001
 */
function generateMRNumber(patientId) {
    return `MR${String(patientId).padStart(5, "0")}`;
}

/**
 * Generate IP Number
 * Format: IP00001
 */
function generateIPNumber(patientId) {
    return `IP${String(patientId).padStart(5, "0")}`;
}

/**
 * Register New Patient
 */
async function registerPatient(patientData) {
    const normalizedData = normalizePatientInput(patientData);

    console.log("Registering patient:", {
        patient_name: normalizedData.patient_name,
        date_of_birth: normalizedData.date_of_birth,
        gender: normalizedData.gender,
        insurance_mode: normalizedData.insurance_mode
    });

    const result = await patientModel.createPatient({
        ...normalizedData,
        mr_no: null,
        ip_no: null
    });

    const patientId = result.insertId;
    const mr_no = generateMRNumber(patientId);
    const ip_no = generateIPNumber(patientId);

    await patientModel.updatePatientNumbers(
        patientId,
        mr_no,
        ip_no
    );

    console.log(`Patient registered successfully: patient_id=${patientId}, mr_no=${mr_no}, ip_no=${ip_no}`);

    return await patientModel.getPatientById(patientId);
}

/**
 * Get All Patients
 */
async function getAllPatients() {
    return await patientModel.getAllPatients();
}

/**
 * Get Patient By ID
 */
async function getPatientById(patientId) {
    return await patientModel.getPatientById(patientId);
}

/**
 * Update Patient
 */
async function updatePatient(patientId, patientData) {
    const normalizedData = normalizePatientInput(patientData);

    console.log(`Updating patient_id=${patientId}`);

    await patientModel.updatePatient(patientId, normalizedData);
    return await patientModel.getPatientById(patientId);
}

/**
 * Delete Patient
 */
async function deletePatient(patientId) {
    console.log(`Deleting patient_id=${patientId}`);
    return await patientModel.deletePatient(patientId);
}

module.exports = {
    registerPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
};
