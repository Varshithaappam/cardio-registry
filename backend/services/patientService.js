const patientModel = require("../models/patientModel");
const { normalizePatientInput } = require("../utils/patientValidation");
const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");

/**
 * Generate MR Number
 * Format: MR00001
 */
function generateMRNumber(regPatientId) {
    return `MR${String(regPatientId).padStart(5, "0")}`;
}

/**
 * Generate IP Number
 * Format: IP00001
 */
function generateIPNumber(regPatientId) {
    return `IP${String(regPatientId).padStart(5, "0")}`;
}

/**
 * Register New Patient
 */
async function registerPatient(patientData, userId = 1) {
    const normalizedData = normalizePatientInput(patientData);

    const mr_no = normalizedData.mr_no;
    if (!mr_no) {
        const error = new Error("MR Number (mr_no) is required.");
        error.status = 400;
        throw error;
    }

    // Validate uniqueness of user-entered MR No
    const { recordset: existingMr } = await db.query(
        'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [mr_no] = @mr_no;',
        { mr_no }
    );
    if (existingMr.length > 0) {
        const error = new Error(`A patient with MR Number "${mr_no}" already exists.`);
        error.status = 409;
        error.code = 2627;
        throw error;
    }

    console.log("Registering patient:", {
        mr_no: mr_no,
        patient_name: normalizedData.patient_name,
        date_of_birth: normalizedData.date_of_birth,
        gender: normalizedData.gender,
        insurance_mode: normalizedData.insurance_mode
    });

    const result = await patientModel.createPatient({
        ...normalizedData,
        mr_no: mr_no,
        ip_no: normalizedData.ip_no || null
    });

    const regPatientId = result.recordset[0].reg_patient_id;
    const ip_no = normalizedData.ip_no || generateIPNumber(regPatientId);

    await patientModel.updatePatientNumbers(
        regPatientId,
        mr_no,
        ip_no
    );

    const registeredPatient = await patientModel.getPatientById(regPatientId);

    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [reg_patient_id] = @regPatientId;', { regPatientId });
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
async function getPatientById(regPatientId) {
    return await patientModel.getPatientById(regPatientId);
}

/**
 * Update Patient
 */
async function updatePatient(regPatientId, patientData, userId = 1) {
    const normalizedData = normalizePatientInput(patientData);

    const mr_no = normalizedData.mr_no;
    if (mr_no) {
        const { recordset: existingMr } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [mr_no] = @mr_no AND [reg_patient_id] != @regPatientId;',
            { mr_no, regPatientId }
        );
        if (existingMr.length > 0) {
            const error = new Error(`A patient with MR Number "${mr_no}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
    }

    console.log(`Updating reg_patient_id=${regPatientId}`);

    const previousPatient = await patientModel.getPatientById(regPatientId);

    await patientModel.updatePatient(regPatientId, normalizedData);

    const updatedPatient = await patientModel.getPatientById(regPatientId);

    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [reg_patient_id] = @regPatientId;', { regPatientId });
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
async function deletePatient(regPatientId, userId = 1) {
    console.log(`Deleting reg_patient_id=${regPatientId}`);
    const previousPatient = await patientModel.getPatientById(regPatientId);
    try {
        const { recordset: regRows } = await db.query('SELECT [hf_id] FROM [hf_registry] WHERE [reg_patient_id] = @regPatientId;', { regPatientId });
        for (const reg of regRows) {
            await logAudit(reg.hf_id, userId, 'DELETE', previousPatient, null);
        }
    } catch (auditErr) {
        console.error("Failed to log audit for patient deletion:", auditErr);
    }
    return await patientModel.deletePatient(regPatientId);
}

async function getPatientCounts(regPatientId) {
    return await patientModel.getPatientCounts(regPatientId);
}

module.exports = {
    registerPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts
};
