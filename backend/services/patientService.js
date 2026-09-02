const patientModel = require("../models/patientModel");
const { normalizePatientInput } = require("../utils/patientValidation");
const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");
const identityIndexService = require("./identityIndexService");
const identityResolutionEngine = require("./identityResolutionEngine");
const patientMatchAuditService = require("./patientMatchAuditService");

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

    // Automatically synchronize shadow identity index
    try {
        await identityIndexService.indexPatient(regPatientId, registeredPatient);
    } catch (indexErr) {
        console.error("Failed to index patient in patient_identity_index:", indexErr);
    }

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

    // Automatically synchronize shadow identity index
    try {
        await identityIndexService.indexPatient(regPatientId, updatedPatient);
    } catch (indexErr) {
        console.error("Failed to update index in patient_identity_index:", indexErr);
    }

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
        await identityIndexService.deleteIndex(regPatientId);
    } catch (indexErr) {
        console.error("Failed to delete index from patient_identity_index:", indexErr);
    }

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

/**
 * Verifies patient identity using the 2-pass deterministic & fuzzy scoring engine
 */
async function verifyPatientIdentity(patientData, user = 'System') {
    const result = await identityResolutionEngine.resolvePatientIdentity(patientData);

    const topCandidate = result.candidates.length > 0 ? result.candidates[0] : null;
    const candidateId = topCandidate ? topCandidate.patient_id : null;

    const auditId = await patientMatchAuditService.logMatchAudit({
        reg_patient_id: null,
        candidate_patient_id: candidateId,
        action: 'VERIFY',
        decision: result.decision,
        user_decision: null,
        overall_score: result.confidence,
        field_scores: topCandidate ? topCandidate.field_scores : null,
        reasons: topCandidate ? topCandidate.reasons : ['No matching candidate found above threshold'],
        algorithm_version: result.algorithm_version,
        created_by: typeof user === 'string' ? user : (user?.name || user?.username || `User_${user?.id || 1}`)
    });

    return {
        ...result,
        verification_id: auditId
    };
}

/**
 * Inserts incoming unverified intake into dbo.patient_staging
 */
async function insertPatientStaging(patientData) {
    const normalized = normalizePatientInput(patientData);
    const pool = await db.getPool();

    const req = pool.request();
    req.input('patient_name', db.sql.VarChar(100), normalized.patient_name || null);
    req.input('date_of_birth', db.sql.Date, normalized.date_of_birth || null);
    req.input('gender', db.sql.VarChar(10), normalized.gender || 'Unknown');
    req.input('phone_no', db.sql.VarChar(15), normalized.phone_no || null);
    req.input('uhid', db.sql.VarChar(50), normalized.uhid || null);
    req.input('abha_number', db.sql.VarChar(50), normalized.abha_number || null);
    req.input('mr_no', db.sql.VarChar(10), normalized.mr_no || null);
    req.input('ip_no', db.sql.VarChar(10), normalized.ip_no || null);
    req.input('blood_group', db.sql.NVarChar(7), normalized.blood_group || 'Unknown');
    req.input('insurance_mode', db.sql.NVarChar(24), normalized.insurance_mode || 'Unknown');
    req.input('email', db.sql.VarChar(100), normalized.email || null);
    req.input('address', db.sql.VarChar(500), normalized.address || null);
    req.input('house_flat_no', db.sql.NVarChar(100), normalized.house_flat_no || null);
    req.input('street_locality', db.sql.NVarChar(255), normalized.street_locality || null);
    req.input('village_town', db.sql.NVarChar(150), normalized.village_town || null);
    req.input('mandal', db.sql.NVarChar(100), normalized.mandal || null);
    req.input('district', db.sql.NVarChar(100), normalized.district || null);
    req.input('state', db.sql.NVarChar(100), normalized.state || null);
    req.input('pincode', db.sql.VarChar(10), normalized.pincode || null);
    req.input('higher_education', db.sql.NVarChar(13), normalized.higher_education || 'None');
    req.input('occupation', db.sql.VarChar(255), normalized.occupation || null);
    req.input('hypertension', db.sql.NVarChar(7), normalized.hypertension || 'No');
    req.input('smoking', db.sql.NVarChar(7), normalized.smoking || 'No');
    req.input('diabetes', db.sql.NVarChar(7), normalized.diabetes || 'No');
    req.input('diabetes_control_type', db.sql.NVarChar(26), normalized.diabetes_control_type || 'Unknown');
    req.input('renal_failure', db.sql.NVarChar(7), normalized.renal_failure || 'No');
    req.input('active_dialysis_status', db.sql.NVarChar(14), normalized.active_dialysis_status || 'Unknown');
    req.input('raw_payload', db.sql.NVarChar(db.sql.MAX), JSON.stringify(patientData));

    const result = await req.query(`
        INSERT INTO dbo.patient_staging (
            patient_name, date_of_birth, gender, phone_no, uhid, abha_number,
            mr_no, ip_no, blood_group, insurance_mode, email, address,
            house_flat_no, street_locality, village_town, mandal, district, state, pincode,
            higher_education, occupation, hypertension, smoking, diabetes,
            diabetes_control_type, renal_failure, active_dialysis_status, raw_payload,
            match_status, created_at, updated_at
        )
        OUTPUT INSERTED.staging_id
        VALUES (
            @patient_name, @date_of_birth, @gender, @phone_no, @uhid, @abha_number,
            @mr_no, @ip_no, @blood_group, @insurance_mode, @email, @address,
            @house_flat_no, @street_locality, @village_town, @mandal, @district, @state, @pincode,
            @higher_education, @occupation, @hypertension, @smoking, @diabetes,
            @diabetes_control_type, @renal_failure, @active_dialysis_status, @raw_payload,
            'PENDING', GETDATE(), GETDATE()
        );
    `);

    return result.recordset[0].staging_id;
}

/**
 * Updates match_status, final_action, and resolved_patient_id in dbo.patient_staging
 */
async function updatePatientStaging(stagingId, matchStatus, finalAction = null, resolvedPatientId = null) {
    const pool = await db.getPool();
    const req = pool.request();
    req.input('stagingId', db.sql.Int, stagingId);
    req.input('matchStatus', db.sql.VarChar(20), matchStatus);
    req.input('finalAction', db.sql.VarChar(30), finalAction);
    req.input('resolvedPatientId', db.sql.Int, resolvedPatientId);

    await req.query(`
        UPDATE dbo.patient_staging
        SET match_status = @matchStatus,
            final_action = @finalAction,
            resolved_patient_id = @resolvedPatientId,
            updated_at = GETDATE()
        WHERE staging_id = @stagingId;
    `);
}

/**
 * Retrieves staging record by staging_id
 */
async function getStagingPatientById(stagingId) {
    const { recordset } = await db.query(
        'SELECT * FROM dbo.patient_staging WHERE staging_id = @stagingId;',
        { stagingId }
    );
    return recordset[0] || null;
}

/**
 * Step 1: Staging Intercept Handler
 */
async function registerWithStagingIntercept(patientData, user = { id: 1 }) {
    const userId = user?.id || user?.userId || 1;

    // 1. Insert incoming req.body into patient_staging with match_status = 'PENDING'
    const stagingId = await insertPatientStaging(patientData);

    // 2. Call fuzzy matching service and log to patient_match_audit
    const verification = await verifyPatientIdentity(patientData, user);
    const confidence = typeof verification.confidence === 'number' ? verification.confidence : (verification.confidence_score ?? 0);
    const candidates = verification.candidates || [];
    const topCandidate = candidates[0] || null;

    // 3. If score < 80%: Auto-create in patient_demographics, update staging to RESOLVED / AUTO_CREATED
    if (confidence < 80.0) {
        const createdPatient = await registerPatient(patientData, userId);
        await updatePatientStaging(stagingId, 'RESOLVED', 'AUTO_CREATED', createdPatient.reg_patient_id);
        
        return {
            status: 'AUTO_CREATED',
            statusCode: 201,
            staging_id: stagingId,
            data: createdPatient
        };
    }

    // 4. If score between 80% and 94.99%: Update staging to REVIEW_REQUIRED, return status 'REVIEW_REQUIRED'
    if (confidence >= 80.0 && confidence < 95.0) {
        await updatePatientStaging(stagingId, 'REVIEW_REQUIRED', null, null);
        return {
            status: 'REVIEW_REQUIRED',
            statusCode: 409,
            staging_id: stagingId,
            confidence,
            matched_patient: topCandidate,
            candidates,
            verification_id: verification.verification_id
        };
    }

    // 5. If score >= 95%: Update staging to REVIEW_REQUIRED, return status 'HIGH_CONFIDENCE_MATCH'
    await updatePatientStaging(stagingId, 'REVIEW_REQUIRED', null, null);
    return {
        status: 'HIGH_CONFIDENCE_MATCH',
        statusCode: 409,
        staging_id: stagingId,
        confidence,
        matched_patient: topCandidate,
        candidates,
        verification_id: verification.verification_id
    };
}

/**
 * Step 3: Resolution Handler (POST /api/resolve-staging)
 */
async function resolveStagingPatient({ staging_id, action, target_patient_id, user = { id: 1 } }) {
    const stagingRow = await getStagingPatientById(staging_id);
    if (!stagingRow) {
        const error = new Error(`Staging record #${staging_id} not found.`);
        error.status = 404;
        throw error;
    }

    const userId = user?.id || user?.userId || 1;

    if (action === 'FORCE_CREATE') {
        // Copy staging data to patient_demographics, generating new ID
        let payload = stagingRow;
        if (stagingRow.raw_payload) {
            try {
                payload = { ...stagingRow, ...JSON.parse(stagingRow.raw_payload) };
            } catch (e) {
                // Ignore JSON parse error, fallback to stagingRow columns
            }
        }

        const newPatient = await registerPatient(payload, userId);
        await updatePatientStaging(staging_id, 'RESOLVED', 'MANUAL_CREATED', newPatient.reg_patient_id);

        // Audit resolution
        await patientMatchAuditService.logMatchAudit({
            incoming_patient_id: staging_id,
            reg_patient_id: newPatient.reg_patient_id,
            candidate_patient_id: target_patient_id || null,
            action: 'FORCE_CREATE',
            decision: 'CONFIRMED_DIFFERENT_PATIENT',
            user_decision: 'MANUAL_CREATED',
            overall_score: 0.0,
            reasons: ['User chose to force register as new distinct patient record'],
            created_by: user?.name || `User_${userId}`
        });

        return {
            success: true,
            message: 'Patient registered successfully from staging.',
            action: 'MANUAL_CREATED',
            staging_id: staging_id,
            data: newPatient
        };
    }

    if (action === 'MERGE') {
        if (!target_patient_id) {
            const error = new Error("target_patient_id is required for action 'MERGE'.");
            error.status = 400;
            throw error;
        }

        // Update staging to RESOLVED / MANUAL_MERGED with the target_patient_id (Do not insert new patient)
        await updatePatientStaging(staging_id, 'RESOLVED', 'MANUAL_MERGED', target_patient_id);

        // Audit resolution
        await patientMatchAuditService.logMatchAudit({
            incoming_patient_id: staging_id,
            reg_patient_id: null,
            candidate_patient_id: target_patient_id,
            action: 'MERGE',
            decision: 'CONFIRMED_SAME_PATIENT',
            user_decision: 'MANUAL_MERGED',
            overall_score: 100.0,
            reasons: ['User chose to merge staging intake with existing patient file'],
            created_by: user?.name || `User_${userId}`
        });

        return {
            success: true,
            message: 'Staging intake successfully merged with existing patient file.',
            action: 'MANUAL_MERGED',
            staging_id: staging_id,
            resolved_patient_id: target_patient_id
        };
    }

    const error = new Error(`Invalid resolution action: "${action}". Expected 'FORCE_CREATE' or 'MERGE'.`);
    error.status = 400;
    throw error;
}

/**
 * Confirms a match decision (User selects "Same Patient")
 */
async function confirmMatch(payload, user = 'System') {
    const { reg_patient_id, candidate_patient_id, user_decision = 'CONFIRMED_SAME_PATIENT', score = null } = payload;

    const auditId = await patientMatchAuditService.logMatchAudit({
        reg_patient_id: reg_patient_id || null,
        candidate_patient_id: candidate_patient_id,
        action: 'CONFIRM_MATCH',
        decision: 'CONFIRMED_SAME_PATIENT',
        user_decision: user_decision || 'USE_EXISTING_PATIENT',
        overall_score: score || 100.0,
        field_scores: null,
        reasons: ['User confirmed candidate is the same patient'],
        algorithm_version: 'v1.0.0',
        created_by: typeof user === 'string' ? user : (user?.name || user?.username || `User_${user?.id || 1}`)
    });

    return { success: true, audit_id: auditId, decision: 'CONFIRMED_SAME_PATIENT' };
}

/**
 * Rejects a match decision (User selects "Different Patient")
 */
async function rejectMatch(payload, user = 'System') {
    const { reg_patient_id, candidate_patient_id, user_decision = 'CONFIRMED_DIFFERENT_PATIENT', score = null } = payload;

    const auditId = await patientMatchAuditService.logMatchAudit({
        reg_patient_id: reg_patient_id || null,
        candidate_patient_id: candidate_patient_id,
        action: 'REJECT_MATCH',
        decision: 'CONFIRMED_DIFFERENT_PATIENT',
        user_decision: user_decision || 'CREATE_NEW_PATIENT',
        overall_score: score || 0.0,
        field_scores: null,
        reasons: ['User confirmed candidate is a distinct patient'],
        algorithm_version: 'v1.0.0',
        created_by: typeof user === 'string' ? user : (user?.name || user?.username || `User_${user?.id || 1}`)
    });

    return { success: true, audit_id: auditId, decision: 'CONFIRMED_DIFFERENT_PATIENT' };
}

/**
 * Fetches compliance audit history
 */
async function getAuditHistory(params) {
    return await patientMatchAuditService.getAuditHistory(params);
}

module.exports = {
    registerPatient,
    insertPatientStaging,
    updatePatientStaging,
    getStagingPatientById,
    registerWithStagingIntercept,
    resolveStagingPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts,
    verifyPatientIdentity,
    confirmMatch,
    rejectMatch,
    getAuditHistory
};
