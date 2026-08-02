const patientModel = require("../models/patientModel");
const { normalizePatientInput } = require("../utils/patientValidation");
const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");

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
async function registerPatient(patientData, userId = 1) {
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

    const patientId = result.recordset[0].patient_id;
    const mr_no = generateMRNumber(patientId);
    const ip_no = generateIPNumber(patientId);

    await patientModel.updatePatientNumbers(
        patientId,
        mr_no,
        ip_no
    );

    const registeredPatient = await patientModel.getPatientById(patientId);

    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [patient_id] = @patientId;', { patientId });
        for (const reg of regRows) {
            await logAudit(reg.hf_id, userId, 'CREATE', null, registeredPatient);
        }
    } catch (auditErr) {
        console.error("Failed to log audit for patient registration:", auditErr);
    }

    return registeredPatient;
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
async function updatePatient(patientId, patientData, userId = 1) {
    const normalizedData = normalizePatientInput(patientData);

    console.log(`Updating patient_id=${patientId}`);

    const previousPatient = await patientModel.getPatientById(patientId);

    await patientModel.updatePatient(patientId, normalizedData);

    const updatedPatient = await patientModel.getPatientById(patientId);

    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [patient_id] = @patientId;', { patientId });
        for (const reg of regRows) {
            await logAudit(reg.hf_id, userId, 'UPDATE', previousPatient, updatedPatient);
        }
    } catch (auditErr) {
        console.error("Failed to log audit for patient update:", auditErr);
    }

    return updatedPatient;
}

/**
 * Delete Patient
 */
async function deletePatient(patientId, userId = 1) {
    console.log(`Deleting patient_id=${patientId}`);
    const previousPatient = await patientModel.getPatientById(patientId);
    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [patient_id] = @patientId;', { patientId });
        for (const reg of regRows) {
            await logAudit(reg.hf_id, userId, 'DELETE', previousPatient, null);
        }
    } catch (auditErr) {
        console.error("Failed to log audit for patient deletion:", auditErr);
    }
    return await patientModel.deletePatient(patientId);
}

async function getPatientCounts(patientId) {
    return await patientModel.getPatientCounts(patientId);
}

module.exports = {
    registerPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts
};
