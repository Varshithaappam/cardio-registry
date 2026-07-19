const db = require("../config/db");

/**
 * Create a new patient
 */
async function createPatient(patientData) {
    const {
        mr_no,
        ip_no,
        patient_name,
        date_of_birth,
        gender,
        blood_group,
        insurance_mode,
        phone_no,
        email,
        hypertension,
        smoking,
        diabetes,
        diabetes_control_type,
        renal_failure,
        active_dialysis_status
    } = patientData;

    const query = `
        INSERT INTO patients (
            mr_no,
            ip_no,
            patient_name,
            date_of_birth,
            gender,
            blood_group,
            insurance_mode,
            phone_no,
            email,
            hypertension,
            smoking,
            diabetes,
            diabetes_control_type,
            renal_failure,
            active_dialysis_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
        mr_no,
        ip_no,
        patient_name,
        date_of_birth,
        gender,
        blood_group,
        insurance_mode,
        phone_no,
        email,
        hypertension,
        smoking,
        diabetes,
        diabetes_control_type,
        renal_failure,
        active_dialysis_status
    ]);

    return result;
}

/**
 * Update MR Number & IP Number
 */
async function updatePatientNumbers(patientId, mr_no, ip_no) {
    const query = `
        UPDATE patients
        SET
            mr_no = ?,
            ip_no = ?
        WHERE patient_id = ?
    `;

    const [result] = await db.execute(query, [
        mr_no,
        ip_no,
        patientId
    ]);

    return result;
}

/**
 * Get all patients
 */
async function getAllPatients() {
    const [rows] = await db.execute(`
        SELECT *
        FROM patients
        ORDER BY patient_id DESC
    `);

    return rows;
}

/**
 * Get patient by ID
 */
async function getPatientById(patientId) {
    const [rows] = await db.execute(
        `
        SELECT *
        FROM patients
        WHERE patient_id = ?
        `,
        [patientId]
    );

    return rows[0];
}

/**
 * Update patient
 */
async function updatePatient(patientId, patientData) {
    const {
        patient_name,
        date_of_birth,
        gender,
        blood_group,
        insurance_mode,
        phone_no,
        email,
        hypertension,
        smoking,
        diabetes,
        diabetes_control_type,
        renal_failure,
        active_dialysis_status
    } = patientData;

    const query = `
        UPDATE patients
        SET
            patient_name = ?,
            date_of_birth = ?,
            gender = ?,
            blood_group = ?,
            insurance_mode = ?,
            phone_no = ?,
            email = ?,
            hypertension = ?,
            smoking = ?,
            diabetes = ?,
            diabetes_control_type = ?,
            renal_failure = ?,
            active_dialysis_status = ?
        WHERE patient_id = ?
    `;

    const [result] = await db.execute(query, [
        patient_name,
        date_of_birth,
        gender,
        blood_group,
        insurance_mode,
        phone_no,
        email,
        hypertension,
        smoking,
        diabetes,
        diabetes_control_type,
        renal_failure,
        active_dialysis_status,
        patientId
    ]);

    return result;
}

/**
 * Delete patient
 */
async function deletePatient(patientId) {
    const [result] = await db.execute(
        `
        DELETE FROM patients
        WHERE patient_id = ?
        `,
        [patientId]
    );

    return result;
}


async function getPatientCounts(patientId) {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM hf_registry WHERE patient_id = ?) as hfCount,
            (SELECT COUNT(*) FROM stemi_registry WHERE patient_id = ?) as stemiCount,
            (SELECT COUNT(*) FROM nstemi_registry WHERE patient_id = ?) as nstemiCount,
            (SELECT COUNT(*) FROM cabg_registry WHERE patient_id = ?) as cabgCount
    `;
    const [rows] = await db.execute(query, [patientId, patientId, patientId, patientId]);
    return rows[0];
}

module.exports = {
    createPatient,
    updatePatientNumbers,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts
};
