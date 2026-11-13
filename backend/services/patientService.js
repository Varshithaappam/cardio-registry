const patientModel = require("../models/patientModel");
const { normalizePatientInput } = require("../utils/patientValidation");
const db = require("../config/db");
const { logAudit } = require("../utils/auditLogger");
const identityIndexService = require("./identityIndexService");
const identityResolutionEngine = require("./identityResolutionEngine");
const patientMatchAuditService = require("./patientMatchAuditService");

/**
 * Generate MR Number
 * Format: DDH.0001
 */
function generateMRNumber(regPatientId) {
    return `DDH.${String(regPatientId).padStart(4, "0")}`;
}

/**
 * Generate IP Number
 * Format: Sequential integer (1, 2, 3, 4...)
 */
function generateIPNumber(regPatientId) {
    return String(regPatientId);
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

    // Validate uniqueness of UHID if provided
    if (normalizedData.uhid) {
        const { recordset: existingUhid } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [uhid] = @uhid;',
            { uhid: normalizedData.uhid }
        );
        if (existingUhid.length > 0) {
            const error = new Error(`A patient with UHID "${normalizedData.uhid}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
    }

    // Validate uniqueness of ABHA Number if provided
    if (normalizedData.national_id_type === 'ABHA' && normalizedData.abha_number) {
        const { recordset: existingAbha } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [abha_number] = @abha_number;',
            { abha_number: normalizedData.abha_number }
        );
        if (existingAbha.length > 0) {
            const error = new Error(`A patient with ABHA Number "${normalizedData.abha_number}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
    }

    // Validate uniqueness of Aadhaar Number if provided
    if (normalizedData.national_id_type === 'Aadhaar' && normalizedData.aadhaar_number) {
        const { recordset: existingAadhaar } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [aadhaar_number] = @aadhaar_number;',
            { aadhaar_number: normalizedData.aadhaar_number }
        );
        if (existingAadhaar.length > 0) {
            const error = new Error(`A patient with Aadhaar Number "${normalizedData.aadhaar_number}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
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

    if (normalizedData.uhid) {
        const { recordset: existingUhid } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [uhid] = @uhid AND [reg_patient_id] != @regPatientId;',
            { uhid: normalizedData.uhid, regPatientId }
        );
        if (existingUhid.length > 0) {
            const error = new Error(`A patient with UHID "${normalizedData.uhid}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
    }

    if (normalizedData.national_id_type === 'ABHA' && normalizedData.abha_number) {
        const { recordset: existingAbha } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [abha_number] = @abha_number AND [reg_patient_id] != @regPatientId;',
            { abha_number: normalizedData.abha_number, regPatientId }
        );
        if (existingAbha.length > 0) {
            const error = new Error(`A patient with ABHA Number "${normalizedData.abha_number}" already exists.`);
            error.status = 409;
            error.code = 2627;
            throw error;
        }
    }

    if (normalizedData.national_id_type === 'Aadhaar' && normalizedData.aadhaar_number) {
        const { recordset: existingAadhaar } = await db.query(
            'SELECT [reg_patient_id] FROM [patient_demographics] WHERE [aadhaar_number] = @aadhaar_number AND [reg_patient_id] != @regPatientId;',
            { aadhaar_number: normalizedData.aadhaar_number, regPatientId }
        );
        if (existingAadhaar.length > 0) {
            const error = new Error(`A patient with Aadhaar Number "${normalizedData.aadhaar_number}" already exists.`);
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

async function getAllPatientCounts() {
    return await patientModel.getAllPatientCounts();
}

/**
 * Verifies patient identity using the deterministic & fuzzy scoring engine.
 * Evaluates all candidate records in patient_demographics and inserts a separate audit log
 * row for every candidate meeting the threshold criteria, linked to the active staging_id.
 */
async function verifyPatientIdentity(patientData, user = 'System', stagingId = null) {
    const result = await identityResolutionEngine.resolvePatientIdentity(patientData);

    // Filter candidates meeting threshold criteria (>= 80% similarity)
    const evaluatedCandidates = (result.candidates || []).filter(
        c => (typeof c.confidence === 'number' ? c.confidence : c.confidence_score ?? 0) >= 80.0
    );

    const auditIds = [];

    // Only write audit entries when an active staging_id exists
    if (stagingId) {
        if (evaluatedCandidates.length > 0) {
            for (const candidate of evaluatedCandidates) {
                const candScore = typeof candidate.confidence === 'number' 
                    ? candidate.confidence 
                    : (candidate.confidence_score ?? 0);
                const candDecision = candScore >= 95.0 
                    ? 'HIGH_CONFIDENCE_MATCH' 
                    : 'REVIEW_REQUIRED';

                try {
                    const auditId = await patientMatchAuditService.logMatchAudit({
                        reg_patient_id: candidate.patient_id || candidate.reg_patient_id, // e.g. 12, 31
                        candidate_patient_id: stagingId,                                  // Single active staging_id
                        action: 'VERIFY',
                        decision: candDecision,
                        user_decision: null,
                        overall_score: candScore,
                        field_scores: candidate.field_scores || null,
                        reasons: candidate.reasons || ['Candidate matched threshold criteria'],
                        algorithm_version: result.algorithm_version,
                        created_by: typeof user === 'string' ? user : (user?.name || user?.username || `User_${user?.id || 1}`)
                    });
                    auditIds.push(auditId);
                } catch (auditErr) {
                    console.error('[Verify Patient] Audit log error:', auditErr.message);
                }
            }
        } else {
            // If no candidate met threshold (< 80%), log a single NO_LIKELY_MATCH entry
            const topCand = (result.candidates || [])[0] || null;
            try {
                const auditId = await patientMatchAuditService.logMatchAudit({
                    reg_patient_id: topCand ? (topCand.patient_id || topCand.reg_patient_id) : null,
                    candidate_patient_id: stagingId,
                    action: 'VERIFY',
                    decision: result.decision || 'NO_LIKELY_MATCH',
                    user_decision: null,
                    overall_score: result.confidence || 0.0,
                    field_scores: topCand ? topCand.field_scores : null,
                    reasons: topCand ? topCand.reasons : ['No matching candidate found above threshold'],
                    algorithm_version: result.algorithm_version,
                    created_by: typeof user === 'string' ? user : (user?.name || user?.username || `User_${user?.id || 1}`)
                });
                auditIds.push(auditId);
            } catch (auditErr) {
                console.error('[Verify Patient] Audit log error:', auditErr.message);
            }
        }
    }

    return {
        ...result,
        staging_id: stagingId,
        verification_id: auditIds[0] || null,
        audit_ids: auditIds
    };
}

/**
 * Inserts incoming unverified intake into dbo.patient_staging (Lean Schema with Clinical Accountability)
 */
async function insertPatientStaging(patientData, createdBy = 'Clinical Staff') {
    const normalized = normalizePatientInput(patientData);
    const pool = await db.getPool();
    const userIdentifier = typeof createdBy === 'string' ? createdBy : (createdBy?.username || createdBy?.name || 'Clinical Staff');

    const req = pool.request();
    req.input('patient_name', db.sql.VarChar(100), normalized.patient_name || null);
    req.input('date_of_birth', db.sql.Date, normalized.date_of_birth || null);
    req.input('gender', db.sql.VarChar(10), normalized.gender || 'Unknown');
    req.input('phone_no', db.sql.VarChar(15), normalized.phone_no || null);
    req.input('uhid', db.sql.VarChar(50), normalized.uhid || null);
    req.input('abha_number', db.sql.VarChar(50), normalized.abha_number || null);
    req.input('mr_no', db.sql.VarChar(10), normalized.mr_no || null);
    req.input('email', db.sql.VarChar(100), normalized.email || null);
    req.input('address', db.sql.VarChar(500), normalized.address || null);
    req.input('pincode', db.sql.VarChar(10), normalized.pincode || null);
    req.input('raw_payload', db.sql.NVarChar(db.sql.MAX), JSON.stringify(patientData));
    req.input('created_by', db.sql.VarChar(100), userIdentifier);

    const result = await req.query(`
        INSERT INTO dbo.patient_staging (
            patient_name, date_of_birth, gender, phone_no, uhid, abha_number,
            mr_no, email, address, pincode, raw_payload, created_by,
            match_status, created_at, updated_at
        )
        OUTPUT INSERTED.staging_id
        VALUES (
            @patient_name, @date_of_birth, @gender, @phone_no, @uhid, @abha_number,
            @mr_no, @email, @address, @pincode, @raw_payload, @created_by,
            'PENDING', GETDATE(), GETDATE()
        );
    `);

    return result.recordset[0].staging_id;
}

/**
 * Retrieves existing staging record if staging_id is provided; otherwise inserts a new row into patient_staging.
 * Ensures that a single submission lifecycle only produces ONE row in patient_staging.
 */
async function getOrCreatePatientStaging(patientData, createdBy = 'Clinical Staff') {
    const existingStagingId = patientData?.staging_id || patientData?.stagingId;
    if (existingStagingId) {
        const existing = await getStagingPatientById(existingStagingId);
        if (existing) {
            return existing.staging_id;
        }
    }
    return await insertPatientStaging(patientData, createdBy);
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
async function registerWithStagingIntercept(patientData, user = { id: 1, username: 'Clinical Staff' }) {
    const userId = user?.id || user?.userId || 1;
    const userName = typeof user === 'string' ? user : (user?.username || user?.name || `User_${userId}`);

    // 1. Ensure only ONE staging row exists per submission lifecycle with dynamic created_by
    const stagingId = await getOrCreatePatientStaging(patientData, userName);

    // 2. Call fuzzy matching service and log audit rows for all matching candidates
    const verification = await verifyPatientIdentity(patientData, user, stagingId);
    const confidence = typeof verification.confidence === 'number' ? verification.confidence : (verification.confidence_score ?? 0);
    const candidates = verification.candidates || [];
    const topCandidate = candidates[0] || null;

    // 3. If score < 80%: Auto-create in patient_demographics, update existing staging row to RESOLVED / AUTO_CREATED
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

    // 4. If score between 80% and 94.99%: Update existing staging row to REVIEW_REQUIRED
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

    // 5. If score >= 95%: Update existing staging row to REVIEW_REQUIRED
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
        // Extract complete original intake values directly from raw_payload (JSON)
        let payload = {};
        if (stagingRow.raw_payload) {
            try {
                payload = typeof stagingRow.raw_payload === 'string'
                    ? JSON.parse(stagingRow.raw_payload)
                    : stagingRow.raw_payload;
            } catch (e) {
                console.error("Error parsing raw_payload in resolveStagingPatient:", e);
                payload = { ...stagingRow };
            }
        } else {
            payload = { ...stagingRow };
        }

        const newPatient = await registerPatient(payload, userId);
        await updatePatientStaging(staging_id, 'RESOLVED', 'MANUAL_CREATED', newPatient.reg_patient_id);

        // Audit resolution:
        // reg_patient_id = existing matched candidate ID (target_patient_id)
        // candidate_patient_id = newly generated staging_id
        await patientMatchAuditService.logMatchAudit({
            reg_patient_id: target_patient_id || null,
            candidate_patient_id: staging_id,
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

        // Audit resolution:
        // reg_patient_id = existing matched patient ID (target_patient_id)
        // candidate_patient_id = staging_id
        await patientMatchAuditService.logMatchAudit({
            reg_patient_id: target_patient_id,
            candidate_patient_id: staging_id,
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
    const existingPatientId = payload.reg_patient_id || payload.candidate_patient_id || payload.matched_patient_id || null;
    const activeStagingId = payload.staging_id || payload.candidate_patient_id || null;

    const auditId = await patientMatchAuditService.logMatchAudit({
        reg_patient_id: existingPatientId,   // 12 (Matched existing patient)
        candidate_patient_id: activeStagingId, // 13 (Active staging_id)
        action: 'CONFIRM_MATCH',
        decision: 'CONFIRMED_SAME_PATIENT',
        user_decision: payload.user_decision || 'USE_EXISTING_PATIENT',
        overall_score: payload.score || 100.0,
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
    const existingPatientId = payload.reg_patient_id || payload.candidate_patient_id || payload.matched_patient_id || null;
    const activeStagingId = payload.staging_id || payload.candidate_patient_id || null;

    const auditId = await patientMatchAuditService.logMatchAudit({
        reg_patient_id: existingPatientId,   // 12 (Matched existing patient)
        candidate_patient_id: activeStagingId, // 13 (Active staging_id)
        action: 'REJECT_MATCH',
        decision: 'CONFIRMED_DIFFERENT_PATIENT',
        user_decision: payload.user_decision || 'CREATE_NEW_PATIENT',
        overall_score: payload.score || 0.0,
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

/**
 * Helper to format date into DD-MM-YYYY
 */
function formatDossierDate(d) {
    if (!d) return null;
    try {
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return String(d);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return String(d);
    }
}

/**
 * Helper to extract all selected TIMI Risk factors with their weighted point labels
 */
function extractTimiRiskFactors(record) {
    if (!record) return [];
    const list = [];
    if (record.age_gt_75 === 'Yes') list.push('Age > 75 years (+3)');
    if (record.age_65_to_74 === 'Yes') list.push('Age 65 to 74 years (+2)');
    if (record.history_dm_htn_angina === 'Yes') list.push('H/o DM/ HTN/ Angina (+1)');
    if (record.sbp_lt_100 === 'Yes') list.push('SBP < 100 mmHg (+3)');
    if (record.heart_rate_gt_100 === 'Yes') list.push('Heart Rate > 100/ min (+2)');
    if (record.killip_class_ii_to_iv === 'Yes') list.push('Killip Class II-IV (+2)');
    if (record.anterior_mi_or_lbbb === 'Yes') list.push('Ant MI/ LBBB (+1)');
    if (record.weight_lt_67kg === 'Yes') list.push('Weight < 67 kg (+1)');
    if (record.reperfusion_gt_4hrs === 'Yes') list.push('Time to reperfusion > 4 hrs (+1)');
    if (record.chd_risk_factors_ge_3 === 'Yes') list.push('Presence of at least 3 CHD risk factors (+1)');
    if (record.prior_coronary_stenosis_gt_50 === 'Yes') list.push('Prior coronary stenosis > 50% (+1)');
    if (record.st_deviation_at_admission === 'Yes') list.push('ST deviation at admission (+1)');
    if (record.anginal_episodes_ge_2_last_24hrs === 'Yes') list.push('>=2 Anginal episodes < 24 hrs (+1)');
    if (record.elevated_serum_cardiac_markers === 'Yes') list.push('Elevated cardiac markers (+1)');
    return list;
}

/**
 * Helper to extract culprit vessel dynamically
 */
function extractCulpritVessel(record) {
    if (!record) return null;
    if (record.culprit_vessel && record.culprit_vessel !== 'None' && record.culprit_vessel !== 'Unknown') {
        return record.culprit_vessel;
    }
    const vessels = [];
    if (record.vessel_lad === 'Yes') vessels.push('LAD');
    if (record.vessel_lcx === 'Yes') vessels.push('LCx');
    if (record.vessel_rca === 'Yes') vessels.push('RCA');
    if (record.vessel_lmca === 'Yes') vessels.push('LMCA');
    if (record.vessel_diagonal === 'Yes') vessels.push('Diagonal');
    if (record.vessel_ramus === 'Yes') vessels.push('Ramus');
    if (record.vessel_om === 'Yes') vessels.push('OM');
    if (record.vessel_pda === 'Yes') vessels.push('PDA');
    return vessels.length > 0 ? vessels.join(', ') : null;
}

/**
 * Helper to extract stent specifications dynamically
 */
function extractStentSpecs(record) {
    if (!record) return null;
    const isDes = record.stent_des === 'Yes' || record.stent_type === 'DES';
    const isBms = record.stent_bms === 'Yes' || record.stent_type === 'BMS';
    const type = isDes ? 'DES' : (isBms ? 'BMS' : (record.stent_type || null));
    const diam = record.stent_diameter;
    const len = record.stent_length;
    if (diam && len) {
        return `${type || 'Stent'} (${diam} × ${len} mm)`;
    }
    if (type) {
        return `${type} (Dimensions not specified)`;
    }
    if (record.pami === 'Yes' || record.ptca === 'Yes') {
        return 'Stent Deployed (Specs not specified)';
    }
    return null;
}

/**
 * Helper to extract presentation symptoms dynamically
 */
function extractAcsSymptoms(record) {
    if (!record) return null;
    const sym = [];
    if (record.typical_angina === 'Yes') sym.push('Typical Angina');
    if (record.atypical_chest_pain === 'Yes') sym.push('Atypical Chest Pain');
    if (record.breathlessness === 'Yes') sym.push('Acute Dyspnea');
    if (record.syncope_presyncope === 'Yes') sym.push('Syncope / Presyncope');
    if (record.diaphoresis === 'Yes') sym.push('Diaphoresis');
    return sym.length > 0 ? sym.join(', ') : null;
}

/**
 * Helper to extract HF medications from encounters dynamically
 */
function extractHfMedications(records = []) {
    const meds = new Set();
    records.forEach(r => {
        const therapy = r.medicalTherapy || r.medical_therapy || r;
        if (!therapy) return;
        if (therapy.bisoprolol === 'Yes' || therapy.carvedilol === 'Yes' || therapy.metoprolol === 'Yes' || therapy.nebivolol === 'Yes') {
            const bb = therapy.bisoprolol === 'Yes' ? 'Bisoprolol' : (therapy.carvedilol === 'Yes' ? 'Carvedilol' : 'Beta-Blocker');
            meds.add(bb);
        }
        if (therapy.spironolactone === 'Yes' || therapy.eplerenone === 'Yes') {
            meds.add(therapy.spironolactone === 'Yes' ? 'Spironolactone' : 'Eplerenone');
        }
        if (therapy.furosemide === 'Yes' || therapy.torsemide === 'Yes') {
            meds.add(therapy.furosemide === 'Yes' ? 'Furosemide' : 'Torsemide');
        }
        if (therapy.sacubitril_valsartan === 'Yes' || therapy.arni === 'Yes') {
            meds.add('Sacubitril/Valsartan (ARNI)');
        } else if (therapy.telmisartan === 'Yes' || therapy.ramipril === 'Yes' || therapy.enalapril === 'Yes' || therapy.losartan === 'Yes') {
            meds.add(therapy.telmisartan === 'Yes' ? 'Telmisartan' : (therapy.ramipril === 'Yes' ? 'Ramipril' : 'ACEi/ARB'));
        }
        if (therapy.dapagliflozin === 'Yes' || therapy.empagliflozin === 'Yes' || therapy.sglt2i === 'Yes') {
            meds.add(therapy.dapagliflozin === 'Yes' ? 'Dapagliflozin' : (therapy.empagliflozin === 'Yes' ? 'Empagliflozin' : 'SGLT2i'));
        }
        if (therapy.aspirin === 'Yes') meds.add('Aspirin');
        if (therapy.digoxin === 'Yes') meds.add('Digoxin');
        if (therapy.ivabradine === 'Yes') meds.add('Ivabradine');
    });

    return Array.from(meds);
}

/**
 * Helper to extract ACS medications from encounters dynamically
 */
function extractAcsMedications(records = []) {
    const meds = new Set();
    records.forEach(r => {
        if (!r) return;
        if (r.discharge_aspirin === 'Yes' || r.aspirin === 'Yes' || r.discharge_aspirin === true) meds.add('Aspirin (75-100 mg OD)');
        if (r.discharge_ticagrelor === 'Yes' || r.ticagrelor === 'Yes' || r.discharge_ticagrelor === true) meds.add('Ticagrelor (90 mg BD)');
        else if (r.discharge_clopidogrel === 'Yes' || r.clopidogrel === 'Yes' || r.discharge_clopidogrel === true) meds.add('Clopidogrel (75 mg OD)');
        else if (r.discharge_prasugrel === 'Yes' || r.prasugrel === 'Yes' || r.discharge_prasugrel === true) meds.add('Prasugrel (10 mg OD)');
        
        if (r.discharge_statin === 'Yes' || r.statin === 'Yes' || r.discharge_statin === true) meds.add('Atorvastatin (40-80 mg OD)');
        if (r.discharge_beta_blocker === 'Yes' || r.beta_blocker === 'Yes' || r.discharge_beta_blocker === true) meds.add('Beta-Blocker (Cardioselective)');
        if (r.discharge_nitrate === 'Yes' || r.nitrate === 'Yes') meds.add('Nitrate');
        if (r.discharge_nicorandil === 'Yes' || r.nicorandil === 'Yes') meds.add('Nicorandil');
    });

    return Array.from(meds);
}

/**
 * Assembles a 100% dynamic cross-registry longitudinal clinical dossier
 * for a patient, synthesizing all real database records across HF, STEMI, and NSTEMI.
 * Strictly uses patient-recorded clinical data without synthetic fallbacks.
 */
async function getLongitudinalDossier(regPatientId) {
    const pool = await db.getPool();
    const sql = db.sql;

    // 1. Fetch Patient Demographics & Baseline Comorbidities
    const patient = await patientModel.getPatientById(regPatientId);
    if (!patient) return null;

    // 2. Fetch all HF records for this patient
    const hfService = require("./hfService");
    let hfRows = [];
    try {
        const hfListRes = await pool.request()
            .input('regPatientId', sql.Int, regPatientId)
            .query(`
                SELECT hf_id, created_at, status 
                FROM [hf_registry] 
                WHERE [reg_patient_id] = @regPatientId
                ORDER BY created_at ASC;
            `);
        hfRows = hfListRes.recordset || [];
    } catch (e) {
        console.warn('Could not query hf_registry:', e.message);
    }

    const hfAssessments = [];
    for (const row of hfRows) {
        try {
            const hfData = await hfService.getHfAssessment(row.hf_id);
            if (hfData) {
                hfAssessments.push({ ...hfData, hf_id: row.hf_id, status: row.status });
            }
        } catch (e) {
            console.error(`Error loading HF assessment ${row.hf_id}:`, e.message);
        }
    }

    // 3. Fetch all STEMI records for this patient
    let stemiRows = [];
    try {
        const stemiListRes = await pool.request()
            .input('regPatientId', sql.Int, regPatientId)
            .query(`
                SELECT stemi_id, created_at, admission_date, acs_no 
                FROM [stemi_registry] 
                WHERE [reg_patient_id] = @regPatientId
                ORDER BY COALESCE(admission_date, created_at) ASC;
            `);
        stemiRows = stemiListRes.recordset || [];
    } catch (e) {
        console.warn('Could not query stemi_registry:', e.message);
    }

    const stemiTables = [
        'stemi_registry', 'stemi_administrative', 'stemi_clinical_assessment', 
        'stemi_diagnostics', 'stemi_treatment_strategy', 'stemi_hospitalization', 
        'stemi_outcomes', 'stemi_appropriateness'
    ];
    const stemiRecords = [];
    for (const row of stemiRows) {
        const merged = { type: 'STEMI', registryType: 'STEMI', stemi_id: row.stemi_id };
        for (const t of stemiTables) {
            try {
                const res = await pool.request()
                    .input('stemi_id', sql.Int, row.stemi_id)
                    .query(`SELECT * FROM [${t}] WHERE [stemi_id] = @stemi_id`);
                if (res.recordset && res.recordset.length > 0) {
                    Object.assign(merged, res.recordset[0]);
                }
            } catch (err) {}
        }
        stemiRecords.push(merged);
    }

    // 4. Fetch all NSTEMI records for this patient
    let nstemiRows = [];
    try {
        const nstemiListRes = await pool.request()
            .input('regPatientId', sql.Int, regPatientId)
            .query(`
                SELECT nstemi_id, created_at, admission_date, acs_no 
                FROM [nstemi_registry] 
                WHERE [reg_patient_id] = @regPatientId
                ORDER BY COALESCE(admission_date, created_at) ASC;
            `);
        nstemiRows = nstemiListRes.recordset || [];
    } catch (e) {
        console.warn('Could not query nstemi_registry:', e.message);
    }

    const nstemiTables = [
        'nstemi_registry', 'nstemi_administrative', 'nstemi_clinical_assessment', 
        'nstemi_diagnostics', 'nstemi_treatment_strategy', 'nstemi_hospitalization', 
        'nstemi_outcomes', 'nstemi_appropriateness'
    ];
    const nstemiRecords = [];
    for (const row of nstemiRows) {
        const merged = { type: 'NSTEMI', registryType: 'NSTEMI', nstemi_id: row.nstemi_id };
        for (const t of nstemiTables) {
            try {
                const res = await pool.request()
                    .input('nstemi_id', sql.Int, row.nstemi_id)
                    .query(`SELECT * FROM [${t}] WHERE [nstemi_id] = @nstemi_id`);
                if (res.recordset && res.recordset.length > 0) {
                    Object.assign(merged, res.recordset[0]);
                }
            } catch (err) {}
        }
        nstemiRecords.push(merged);
    }

    // Combine all encounters into a single chronological timeline list
    const encounters = [];

    // Map HF Assessments
    hfAssessments.forEach((hfa) => {
        const encDate = hfa.assessmentDate || 
                        hfa.date_of_visit_hospitalization || 
                        hfa.date_of_admission || 
                        hfa.inpatientDetails?.dateOfAdmission ||
                        hfa.inpatientDetails?.assessmentDate || 
                        hfa.assessment_date || 
                        hfa.created_at ||
                        hfa.inpatientDetails?.dischargeDate;

        let stayDays = (hfa.inpatientDetails?.daysHospitalized != null && !isNaN(Number(hfa.inpatientDetails.daysHospitalized)))
            ? Number(hfa.inpatientDetails.daysHospitalized)
            : ((hfa.hospitalization_days != null && !isNaN(Number(hfa.hospitalization_days))) ? Number(hfa.hospitalization_days) : null);
        
        const admDate = encDate;
        const dischDate = hfa.inpatientDetails?.dischargeDate || hfa.discharge_date;
        if ((stayDays == null || stayDays === 0) && admDate && dischDate) {
            const d1 = new Date(admDate);
            const d2 = new Date(dischDate);
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                stayDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            }
        }
        
        // Dynamic LVEF: validate physiological range (10% to 90%)
        const rawLvef = hfa.investigations?.echoEfPercent ?? hfa.cardiac?.echo_ef ?? hfa.echo_ef ?? hfa.investigations?.echo_ef ?? hfa.investigations?.mriLvef ?? null;
        const lvef = (rawLvef !== null && rawLvef !== '' && !isNaN(Number(rawLvef)) && Number(rawLvef) >= 10 && Number(rawLvef) <= 90) ? Number(rawLvef) : null;
        
        // Vitals: validate physiological ranges
        const rawSbp = hfa.vitals?.systolicBp ?? hfa.vitals?.systolicBpSitting ?? hfa.systolic_bp_sitting ?? hfa.systolicBp ?? null;
        const sbp = (rawSbp !== null && rawSbp !== '' && !isNaN(Number(rawSbp)) && Number(rawSbp) >= 50 && Number(rawSbp) <= 260) ? Number(rawSbp) : null;

        const rawDbp = hfa.vitals?.diastolicBp ?? hfa.vitals?.diastolicBpSitting ?? hfa.diastolic_bp_sitting ?? hfa.diastolicBp ?? null;
        const dbp = (rawDbp !== null && rawDbp !== '' && !isNaN(Number(rawDbp)) && Number(rawDbp) >= 30 && Number(rawDbp) <= 160) ? Number(rawDbp) : null;

        const rawHr = hfa.vitals?.heartRate ?? hfa.heartRate ?? hfa.heart_rate ?? null;
        const hr = (rawHr !== null && rawHr !== '' && !isNaN(Number(rawHr)) && Number(rawHr) >= 30 && Number(rawHr) <= 220) ? Number(rawHr) : null;

        const rawWeight = hfa.vitals?.weight ?? hfa.weight ?? null;
        const weight = (rawWeight !== null && rawWeight !== '' && !isNaN(Number(rawWeight))) ? Number(rawWeight) : null;

        // Labs: validate physiological ranges
        const rawCr = hfa.investigations?.labTests?.creatinine?.result ?? hfa.labs?.creatinine ?? hfa.creatinine_result ?? hfa.investigations?.creatinine ?? null;
        const cr = (rawCr !== null && rawCr !== '' && !isNaN(Number(rawCr)) && Number(rawCr) >= 0.1 && Number(rawCr) <= 20) ? Number(rawCr) : null;

        const rawK = hfa.investigations?.labTests?.potassium?.result ?? hfa.labs?.potassium ?? hfa.potassium_result ?? hfa.investigations?.potassium ?? null;
        const k = (rawK !== null && rawK !== '' && !isNaN(Number(rawK)) && Number(rawK) >= 1.5 && Number(rawK) <= 9.0) ? Number(rawK) : null;

        const rawHb = hfa.investigations?.labTests?.hemoglobin?.result ?? hfa.labs?.hemoglobin ?? hfa.hemoglobin_result ?? hfa.investigations?.hemoglobin ?? null;
        const hb = (rawHb !== null && rawHb !== '' && !isNaN(Number(rawHb)) && Number(rawHb) >= 3.0 && Number(rawHb) <= 25.0) ? Number(rawHb) : null;

        const rawNyha = hfa.nyhaClass || hfa.initial_nyha_class || (hfa.stageOfHF ? `Stage ${hfa.stageOfHF}` : null);
        const nyha = rawNyha ? (String(rawNyha).trim().startsWith('NYHA') ? String(rawNyha).trim() : `NYHA ${String(rawNyha).trim()}`) : null;
        const hfType = lvef !== null ? (lvef < 40 ? 'HFrEF' : (lvef < 50 ? 'HFmrEF' : 'HFpEF')) : (hfa.patient?.presentDiagnosis || 'Heart Failure');

        // Dynamic ECG
        const ecgParts = [];
        if (hfa.cardiac?.ecg_rhythm_af === 'Yes') ecgParts.push('Atrial Fibrillation');
        else if (hfa.cardiac?.ecg_rhythm_sinus === 'Yes') ecgParts.push('Sinus Rhythm');
        if (hfa.cardiac?.ecg_av_first_degree_block === 'Yes') ecgParts.push('1st Degree AVB');
        if (hfa.cardiac?.ecg_av_second_degree_block === 'Yes') ecgParts.push('2nd Degree AVB');
        if (hfa.cardiac?.ecg_av_third_degree_block === 'Yes') ecgParts.push('Complete Heart Block');
        if (hfa.cardiac?.ecg_rbbb === 'Yes') ecgParts.push('RBBB');
        if (hfa.cardiac?.ecg_lbbb === 'Yes') ecgParts.push('LBBB');
        const ecgFindings = ecgParts.length > 0 ? ecgParts.join(', ') : 'ECG not documented';

        // Dynamic Echo
        const echoParts = [];
        if (lvef !== null) echoParts.push(`LVEF ${lvef}%`);
        if (hfa.cardiac?.echoRwmi && hfa.cardiac.echoRwmi !== 'None') echoParts.push(`RWMI: ${hfa.cardiac.echoRwmi}`);
        if (hfa.cardiac?.echoMrMitralRegurg && hfa.cardiac.echoMrMitralRegurg !== 'None') echoParts.push(`MR: Grade ${hfa.cardiac.echoMrMitralRegurg}`);
        if (hfa.investigations?.echoRvFunction) echoParts.push(`RV: ${hfa.investigations.echoRvFunction}`);
        const echoFindings = echoParts.length > 0 ? echoParts.join(', ') : '2D Echo not recorded';

        // Dynamic Labs
        const labParts = [];
        if (hb !== null) labParts.push(`Hb ${hb} g/dL`);
        if (cr !== null) labParts.push(`Serum Cr ${cr} mg/dL`);
        if (k !== null) labParts.push(`K⁺ ${k} mEq/L`);
        const labsFindings = labParts.length > 0 ? labParts.join(', ') : 'Labs not documented';

        // Dynamic Symptoms
        const precip = hfa.inpatientDetails?.precipitatingFactors || [];
        const symptoms = precip.length > 0 ? precip.join(', ') : (hfa.patient?.presentDiagnosis || 'Dyspnea / Decompensation');

        encounters.push({
            type: 'HF',
            registryType: 'HF',
            id: hfa.hf_id,
            registryNo: hfa.hf_registry_no || `HF${String(hfa.hf_id).padStart(5, '0')}`,
            ipNo: hfa.care_mr_no || hfa.ip_no || 'IP-HF',
            date: encDate,
            formattedDate: formatDossierDate(encDate),
            stayDays,
            lvef,
            sbp,
            dbp,
            hr,
            weight,
            cr,
            k,
            hb,
            nyha,
            hfType,
            diagnosis: `Heart Failure (${hfType})` + (nyha ? ` · ${nyha}` : ''),
            presentationSymptoms: symptoms,
            admissionVitals: [
                hr !== null ? `HR ${hr} bpm` : null,
                sbp !== null ? `BP ${sbp}/${dbp || ''} mmHg` : null,
                nyha
            ].filter(Boolean).join(' · ') || 'Vitals not recorded',
            timiScoreText: 'N/A (HF Protocol)',
            ecgFindings,
            echoFindings,
            labsFindings,
            primaryReperfusion: 'Guideline-Directed Medical Therapy (GDMT)',
            catheterization: hfa.cardiac?.angiogram_done === 'Yes' ? 'Coronary Angiogram performed' : 'Not performed',
            proceduralSuccess: 'N/A',
            complicationsManaged: 'Standard inpatient care. No acute MACE logged.',
            raw: hfa
        });
    });

    // Map STEMI Records
    stemiRecords.forEach((st) => {
        const encDate = st.admission_date || st.date_of_admission || st.event_date || st.created_at;
        let stayDays = (st.total_stay_days != null && !isNaN(Number(st.total_stay_days)))
            ? Number(st.total_stay_days)
            : ((st.los_iccu != null && !isNaN(Number(st.los_iccu))) ? Number(st.los_iccu) : null);

        const stAdm = encDate;
        const stDis = st.discharge_date || st.date_of_discharge;
        if ((stayDays == null || stayDays === 0) && stAdm && stDis) {
            const d1 = new Date(stAdm);
            const d2 = new Date(stDis);
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                stayDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            }
        }

        // Dynamic LVEF: validate physiological range (10% to 90%)
        const rawLvef = st.echo_ef ?? st.lvef ?? null;
        const lvef = (rawLvef !== null && rawLvef !== '' && !isNaN(Number(rawLvef)) && Number(rawLvef) >= 10 && Number(rawLvef) <= 90) ? Number(rawLvef) : null;

        // Vitals: validate physiological ranges
        const rawSbp = st.systolic_bp;
        const sbp = (rawSbp !== null && rawSbp !== '' && !isNaN(Number(rawSbp)) && Number(rawSbp) >= 50 && Number(rawSbp) <= 260) ? Number(rawSbp) : null;

        const rawDbp = st.diastolic_bp;
        const dbp = (rawDbp !== null && rawDbp !== '' && !isNaN(Number(rawDbp)) && Number(rawDbp) >= 30 && Number(rawDbp) <= 160) ? Number(rawDbp) : null;

        const rawHr = (st.pulse_rate !== null && st.pulse_rate !== '' && !isNaN(Number(st.pulse_rate))) 
            ? Number(st.pulse_rate) 
            : ((st.ecg_heart_rate !== null && st.ecg_heart_rate !== '' && !isNaN(Number(st.ecg_heart_rate))) ? Number(st.ecg_heart_rate) : null);
        const hr = (rawHr !== null && !isNaN(Number(rawHr)) && Number(rawHr) >= 30 && Number(rawHr) <= 220) ? Number(rawHr) : null;

        // Labs: validate physiological ranges
        const rawCr = st.creatinine;
        const cr = (rawCr !== null && rawCr !== '' && !isNaN(Number(rawCr)) && Number(rawCr) >= 0.1 && Number(rawCr) <= 20) ? Number(rawCr) : null;

        const rawK = st.potassium;
        const k = (rawK !== null && rawK !== '' && !isNaN(Number(rawK)) && Number(rawK) >= 1.5 && Number(rawK) <= 9.0) ? Number(rawK) : null;

        const rawHb = st.hemoglobin;
        const hb = (rawHb !== null && rawHb !== '' && !isNaN(Number(rawHb)) && Number(rawHb) >= 3.0 && Number(rawHb) <= 25.0) ? Number(rawHb) : null;

        const killip = st.killip_class || (st.killip_class_ii_to_iv === 'Yes' ? 'Class II-IV' : (sbp !== null && sbp < 90 ? 'Class IV (Shock)' : 'Class I'));
        const timiScore = (st.timi_total_score !== null && st.timi_total_score !== '' && !isNaN(Number(st.timi_total_score))) ? Number(st.timi_total_score) : null;
        const timiFactors = extractTimiRiskFactors(st);
        const vessel = extractCulpritVessel(st);
        const stent = extractStentSpecs(st);
        const d2b = (st.door_to_balloon_time !== null && st.door_to_balloon_time !== '' && !isNaN(Number(st.door_to_balloon_time))) ? Number(st.door_to_balloon_time) : null;
        const d2n = (st.door_to_needle_time !== null && st.door_to_needle_time !== '' && !isNaN(Number(st.door_to_needle_time))) ? Number(st.door_to_needle_time) : null;
        const thrombolyticAgent = st.drug_tenecteplase === 'Yes' ? 'Tenecteplase' : (st.drug_reteplase === 'Yes' ? 'Reteplase' : (st.drug_stk === 'Yes' ? 'Streptokinase' : (st.drug_uk === 'Yes' ? 'Urokinase' : (st.thrombolytic_agent || null))));
        const timiFlow = st.timi_flow != null ? String(st.timi_flow) : (st.post_procedure_timi_flow != null ? String(st.post_procedure_timi_flow) : null);

        const complications = [
            st.cardiogenic_shock === 'Yes' ? 'Cardiogenic shock' : null,
            st.pulmonary_edema === 'Yes' ? 'Pulmonary edema' : null,
            st.complication_tamponade === 'Yes' ? 'Cardiac tamponade' : null,
            st.complication_major_bleed === 'Yes' ? 'Major bleed' : null,
            st.complication_stroke === 'Yes' ? 'Stroke' : null,
            st.complication_mi === 'Yes' ? 'Re-MI' : null,
            st.complication_stent_thrombosis === 'Yes' ? 'Stent thrombosis' : null,
            st.vt_vf === 'Yes' ? 'VT/VF' : null
        ].filter(Boolean);

        const strategy = st.pami === 'Yes' ? 'Primary PCI' : (st.thrombolysis === 'Yes' ? 'Thrombolysis' : 'Conservative');

        // Dynamic Symptoms
        const symptoms = extractAcsSymptoms(st) || 'Acute Chest Pain';

        // Dynamic ECG
        const ecgParts = [];
        if (st.rhythm_af === 'Yes') ecgParts.push('Atrial Fibrillation');
        else if (st.rhythm_nsr === 'Yes') ecgParts.push('Normal Sinus Rhythm');
        else if (st.rhythm_vt === 'Yes') ecgParts.push('Ventricular Tachycardia');
        if (st.av_block_first_degree === 'Yes') ecgParts.push('1st Degree AVB');
        if (st.av_block_second_degree === 'Yes') ecgParts.push('2nd Degree AVB');
        if (st.av_block_chb === 'Yes') ecgParts.push('Complete Heart Block');
        if (st.bbb_rbbb === 'Yes') ecgParts.push('RBBB');
        if (st.bbb_lbbb === 'Yes') ecgParts.push('LBBB');
        if (st.anterior_mi_or_lbbb === 'Yes') ecgParts.push('ST elevation (Anterior/LBBB)');
        const ecgFindings = ecgParts.length > 0 ? ecgParts.join(', ') : 'ECG not documented';

        // Dynamic Echo
        const echoParts = [];
        if (lvef !== null) echoParts.push(`LVEF ${lvef}%`);
        if (st.lv_function_mild_lvd === 'Yes') echoParts.push('Mild LVD');
        else if (st.lv_function_moderate_lvd === 'Yes') echoParts.push('Moderate LVD');
        else if (st.lv_function_severe_lvd === 'Yes') echoParts.push('Severe LVD');
        
        const rwma = [
            st.rwma_lad === 'Yes' && 'LAD',
            st.rwma_rca === 'Yes' && 'RCA',
            st.rwma_lcx === 'Yes' && 'LCx'
        ].filter(Boolean);
        if (rwma.length > 0) echoParts.push(`RWMA in ${rwma.join('/')}`);
        else if (st.echo_other) echoParts.push(st.echo_other);

        if (st.mr_severe === 'Yes') echoParts.push('Severe MR');
        else if (st.mr_moderate === 'Yes') echoParts.push('Moderate MR');
        else if (st.mr_mild === 'Yes') echoParts.push('Mild MR');

        const echoFindings = echoParts.length > 0 ? echoParts.join(', ') : '2D Echo not recorded';

        // Dynamic Labs
        const labParts = [];
        if (hb !== null) labParts.push(`Hb ${hb} g/dL`);
        if (cr !== null) labParts.push(`Serum Cr ${cr} mg/dL`);
        if (k !== null) labParts.push(`K⁺ ${k} mEq/L`);
        if (st.troponin_i) labParts.push(`Trop-I: ${st.troponin_i}`);
        const labsFindings = labParts.length > 0 ? labParts.join(', ') : 'Labs not documented';

        // Dynamic Reperfusion
        let reperfusionText = 'Conservative / Medical Management';
        if (strategy === 'Primary PCI') {
            reperfusionText = `Primary PCI (Door-to-Balloon: ${d2b !== null ? d2b + ' mins' : 'N/A'})`;
        } else if (strategy === 'Thrombolysis') {
            reperfusionText = `Thrombolysis (Door-to-Needle: ${d2n !== null ? d2n + ' mins' : 'N/A'}) with ${thrombolyticAgent || 'Thrombolytic agent'}`;
        }

        // Dynamic Cath
        let cathText = 'Not performed';
        if (vessel || stent || st.pami === 'Yes' || st.ptca === 'Yes' || st.cag === 'Yes' || st.angiogram_done === 'Yes') {
            cathText = `Coronary Angiography (${vessel || 'Vessel unrecorded'})` + (stent ? ` + ${stent}` : '');
        }

        encounters.push({
            type: 'STEMI',
            registryType: 'STEMI',
            id: st.stemi_id,
            registryNo: st.acs_no || `ACS.${String(st.stemi_id).padStart(4, '0')}`,
            ipNo: st.ip_no || 'IP-STEMI',
            date: encDate,
            formattedDate: formatDossierDate(encDate),
            stayDays,
            lvef,
            sbp,
            dbp,
            hr,
            weight: null,
            cr,
            k,
            hb,
            killip,
            timiScore,
            timiFactors,
            vessel,
            stent,
            d2b,
            d2n,
            thrombolyticAgent,
            timiFlow,
            complications,
            strategy,
            diagnosis: `Acute STEMI · Killip ${killip}` + (st.anterior_mi_or_lbbb === 'Yes' ? ' (Anterior)' : ''),
            presentationSymptoms: symptoms,
            admissionVitals: [
                hr !== null ? `HR ${hr} bpm` : null,
                sbp !== null ? `BP ${sbp}/${dbp || ''} mmHg` : null,
                `Killip ${killip}`
            ].filter(Boolean).join(' · ') || 'Vitals not recorded',
            timiScoreText: timiScore !== null ? `${timiScore} Points (${timiScore > 5 ? 'High Risk' : (timiScore >= 3 ? 'Intermediate Risk' : 'Low Risk')})` : 'Not assessed',
            ecgFindings,
            echoFindings,
            labsFindings,
            primaryReperfusion: reperfusionText,
            catheterization: cathText,
            proceduralSuccess: timiFlow ? `Post-procedure TIMI Flow Grade ${timiFlow} achieved.` : 'N/A',
            complicationsManaged: complications.length > 0 ? complications.join(', ') : 'Uncomplicated hospital course. No acute in-hospital MACE.',
            raw: st
        });
    });

    // Map NSTEMI Records
    nstemiRecords.forEach((ns) => {
        const encDate = ns.admission_date || ns.date_of_admission || ns.event_date || ns.created_at;
        let stayDays = (ns.total_stay_days != null && !isNaN(Number(ns.total_stay_days)))
            ? Number(ns.total_stay_days)
            : ((ns.los_iccu != null && !isNaN(Number(ns.los_iccu))) ? Number(ns.los_iccu) : null);

        const nsAdm = encDate;
        const nsDis = ns.discharge_date || ns.date_of_discharge;
        if ((stayDays == null || stayDays === 0) && nsAdm && nsDis) {
            const d1 = new Date(nsAdm);
            const d2 = new Date(nsDis);
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                stayDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            }
        }

        // Dynamic LVEF: validate physiological range (10% to 90%)
        const rawLvef = ns.echo_ef ?? ns.lvef ?? null;
        const lvef = (rawLvef !== null && rawLvef !== '' && !isNaN(Number(rawLvef)) && Number(rawLvef) >= 10 && Number(rawLvef) <= 90) ? Number(rawLvef) : null;

        // Vitals: validate physiological ranges
        const rawSbp = ns.systolic_bp;
        const sbp = (rawSbp !== null && rawSbp !== '' && !isNaN(Number(rawSbp)) && Number(rawSbp) >= 50 && Number(rawSbp) <= 260) ? Number(rawSbp) : null;

        const rawDbp = ns.diastolic_bp;
        const dbp = (rawDbp !== null && rawDbp !== '' && !isNaN(Number(rawDbp)) && Number(rawDbp) >= 30 && Number(rawDbp) <= 160) ? Number(rawDbp) : null;

        const rawHr = (ns.pulse_rate !== null && ns.pulse_rate !== '' && !isNaN(Number(ns.pulse_rate))) 
            ? Number(ns.pulse_rate) 
            : ((ns.ecg_heart_rate !== null && ns.ecg_heart_rate !== '' && !isNaN(Number(ns.ecg_heart_rate))) ? Number(ns.ecg_heart_rate) : null);
        const hr = (rawHr !== null && !isNaN(Number(rawHr)) && Number(rawHr) >= 30 && Number(rawHr) <= 220) ? Number(rawHr) : null;

        // Labs: validate physiological ranges
        const rawCr = ns.creatinine;
        const cr = (rawCr !== null && rawCr !== '' && !isNaN(Number(rawCr)) && Number(rawCr) >= 0.1 && Number(rawCr) <= 20) ? Number(rawCr) : null;

        const rawK = ns.potassium;
        const k = (rawK !== null && rawK !== '' && !isNaN(Number(rawK)) && Number(rawK) >= 1.5 && Number(rawK) <= 9.0) ? Number(rawK) : null;

        const rawHb = ns.hemoglobin;
        const hb = (rawHb !== null && rawHb !== '' && !isNaN(Number(rawHb)) && Number(rawHb) >= 3.0 && Number(rawHb) <= 25.0) ? Number(rawHb) : null;

        const killip = ns.killip_class || (ns.killip_class_ii_to_iv === 'Yes' ? 'Class II' : (sbp !== null && sbp < 90 ? 'Class IV' : 'Class I'));
        const timiScore = (ns.timi_total_score !== null && ns.timi_total_score !== '' && !isNaN(Number(ns.timi_total_score))) ? Number(ns.timi_total_score) : null;
        const timiFactors = extractTimiRiskFactors(ns);
        const vessel = extractCulpritVessel(ns);
        const stent = extractStentSpecs(ns);
        const timiFlow = ns.timi_flow != null ? String(ns.timi_flow) : (ns.post_procedure_timi_flow != null ? String(ns.post_procedure_timi_flow) : null);

        const complications = [
            ns.cardiogenic_shock === 'Yes' ? 'Cardiogenic shock' : null,
            ns.pulmonary_edema === 'Yes' ? 'Pulmonary edema' : null,
            ns.complication_tamponade === 'Yes' ? 'Cardiac tamponade' : null,
            ns.complication_major_bleed === 'Yes' ? 'Major bleed' : null,
            ns.complication_stroke === 'Yes' ? 'Stroke' : null,
            ns.complication_mi === 'Yes' ? 'Re-MI' : null
        ].filter(Boolean);

        const strategy = ns.pci === 'Yes' ? 'Invasive (PCI)' : (ns.cabg === 'Yes' ? 'CABG' : 'Medical Management');
        const symptoms = extractAcsSymptoms(ns) || 'Chest Pain / Angina Equivalent';

        // Dynamic ECG
        const ecgParts = [];
        if (ns.rhythm_af === 'Yes') ecgParts.push('Atrial Fibrillation');
        else if (ns.rhythm_nsr === 'Yes') ecgParts.push('Normal Sinus Rhythm');
        if (ns.st_deviation_at_admission === 'Yes') ecgParts.push('ST depression / T-inversion');
        if (ns.av_block_first_degree === 'Yes') ecgParts.push('1st Degree AVB');
        if (ns.bbb_rbbb === 'Yes') ecgParts.push('RBBB');
        if (ns.bbb_lbbb === 'Yes') ecgParts.push('LBBB');
        const ecgFindings = ecgParts.length > 0 ? ecgParts.join(', ') : 'ECG not documented';

        // Dynamic Echo
        const echoParts = [];
        if (lvef !== null) echoParts.push(`LVEF ${lvef}%`);
        if (ns.lv_function_mild_lvd === 'Yes') echoParts.push('Mild LVD');
        else if (ns.lv_function_moderate_lvd === 'Yes') echoParts.push('Moderate LVD');
        else if (ns.lv_function_severe_lvd === 'Yes') echoParts.push('Severe LVD');

        const rwma = [
            ns.rwma_lad === 'Yes' && 'LAD',
            ns.rwma_rca === 'Yes' && 'RCA',
            ns.rwma_lcx === 'Yes' && 'LCx'
        ].filter(Boolean);
        if (rwma.length > 0) echoParts.push(`RWMA in ${rwma.join('/')}`);
        else if (ns.echo_other) echoParts.push(ns.echo_other);

        if (ns.mr_severe === 'Yes') echoParts.push('Severe MR');
        else if (ns.mr_moderate === 'Yes') echoParts.push('Moderate MR');
        else if (ns.mr_mild === 'Yes') echoParts.push('Mild MR');

        const echoFindings = echoParts.length > 0 ? echoParts.join(', ') : '2D Echo not recorded';

        // Dynamic Labs
        const labParts = [];
        if (hb !== null) labParts.push(`Hb ${hb} g/dL`);
        if (cr !== null) labParts.push(`Serum Cr ${cr} mg/dL`);
        if (k !== null) labParts.push(`K⁺ ${k} mEq/L`);
        if (ns.troponin_i) labParts.push(`Trop-I: ${ns.troponin_i}`);
        const labsFindings = labParts.length > 0 ? labParts.join(', ') : 'Labs not documented';

        // Dynamic Cath
        let cathText = 'Not performed';
        if (vessel || stent || ns.pci === 'Yes' || ns.ptca === 'Yes' || ns.cag === 'Yes' || ns.angiogram_done === 'Yes') {
            cathText = `Coronary Angiography (${vessel || 'Vessel unrecorded'})` + (stent ? ` + ${stent}` : '');
        }

        encounters.push({
            type: 'NSTEMI',
            registryType: 'NSTEMI',
            id: ns.nstemi_id,
            registryNo: ns.acs_no || `ACS.${String(ns.nstemi_id).padStart(4, '0')}`,
            ipNo: ns.ip_no || 'IP-NSTEMI',
            date: encDate,
            formattedDate: formatDossierDate(encDate),
            stayDays,
            lvef,
            sbp,
            dbp,
            hr,
            weight: null,
            cr,
            k,
            hb,
            killip,
            timiScore,
            timiFactors,
            vessel,
            stent,
            timiFlow,
            complications,
            strategy,
            diagnosis: `NSTEMI · Killip ${killip}`,
            presentationSymptoms: symptoms,
            admissionVitals: [
                hr !== null ? `HR ${hr} bpm` : null,
                sbp !== null ? `BP ${sbp}/${dbp || ''} mmHg` : null,
                `Killip ${killip}`
            ].filter(Boolean).join(' · ') || 'Vitals not recorded',
            timiScoreText: timiScore !== null ? `${timiScore} Points (${timiScore > 4 ? 'High Risk' : (timiScore >= 2 ? 'Intermediate Risk' : 'Low Risk')})` : 'Not assessed',
            ecgFindings,
            echoFindings,
            labsFindings,
            primaryReperfusion: strategy === 'Invasive (PCI)' ? 'Early Invasive Coronary Angiography / PCI' : 'Conservative Medical Stabilization',
            catheterization: cathText,
            proceduralSuccess: timiFlow ? `Post-procedure TIMI Flow Grade ${timiFlow} achieved.` : 'N/A',
            complicationsManaged: complications.length > 0 ? complications.join(', ') : 'Uncomplicated hospital course. No acute in-hospital MACE.',
            raw: ns
        });
    });

    // =========================================================================
    // 1. ALL ENCOUNTERS (CHRONOLOGICAL EARLIEST -> LATEST) FOR THE TRAJECTORY GRAPH
    // =========================================================================
    const allEncounters = [...encounters].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    // The graph strictly includes real patient records without synthetic baseline points or invalid dates
    const chartData = allEncounters
        .filter(e => e.formattedDate && e.formattedDate !== '—' && e.date)
        .map(e => ({
            date: e.formattedDate,
            displayDate: e.formattedDate,
            lvef: e.lvef,
            sbp: e.sbp,
            dbp: e.dbp,
            hr: e.hr,
            creatinine: e.cr,
            potassium: e.k,
            hb: e.hb,
            type: e.type,
            recordId: e.registryNo
        }));

    // =========================================================================
    // 2. CLINICAL SUMMARY SELECTION: RECENT 3 OF HF, STEMI, AND NSTEMI (EACH UP TO 3)
    // =========================================================================
    // User requirement: "take past 3 records of hf, stemi and nstemi each 3; if only 2 consider 2, if 5 consider recent 3"
    const recentHfEncounters = allEncounters
        .filter(e => e.type === 'HF')
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3);

    const recentStemiEncounters = allEncounters
        .filter(e => e.type === 'STEMI')
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3);

    const recentNstemiEncounters = allEncounters
        .filter(e => e.type === 'NSTEMI')
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 3);

    // Combine recent records for the clinical summary (sorted reverse-chronologically)
    const summaryEncounters = [
        ...recentHfEncounters,
        ...recentStemiEncounters,
        ...recentNstemiEncounters
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Calculate Totals Across All Registry Records
    const totalHospitalDays = allEncounters.reduce((sum, e) => sum + (e.stayDays || 0), 0);
    const totalPcis = stemiRecords.filter(s => s.pami === 'Yes' || s.ptca === 'Yes').length + 
                      nstemiRecords.filter(ns => ns.pci === 'Yes' || ns.ptca === 'Yes').length;
    const totalStents = stemiRecords.filter(s => s.stent_des === 'Yes' || s.stent_bms === 'Yes').length + 
                        nstemiRecords.filter(ns => ns.stent_des === 'Yes' || ns.stent_bms === 'Yes').length;
    const totalThrombolysis = stemiRecords.filter(s => s.thrombolysis === 'Yes' || s.door_to_needle_time != null || s.thrombolytic_agent).length;
    const inHospitalDeaths = stemiRecords.filter(s => s.in_hospital_death === 'Yes').length + 
                            nstemiRecords.filter(ns => ns.in_hospital_death === 'Yes').length;

    // Latest Vitals derived from the most recent summary encounter
    const latestEncounter = summaryEncounters.length > 0 ? summaryEncounters[0] : (allEncounters[allEncounters.length - 1] || null);
    const bpSys = latestEncounter?.sbp ?? null;
    const bpDia = latestEncounter?.dbp ?? null;
    const heartRate = latestEncounter?.hr ?? null;
    const patientWeight = latestEncounter?.weight ?? null;

    const latestHf = recentHfEncounters.length > 0 ? recentHfEncounters[0] : (hfAssessments[hfAssessments.length - 1] || null);
    const recentAcsList = [...recentStemiEncounters, ...recentNstemiEncounters].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const latestAcs = recentAcsList.length > 0 ? recentAcsList[0] : (stemiRecords[stemiRecords.length - 1] || nstemiRecords[nstemiRecords.length - 1] || null);

    const nyhaClass = latestHf?.nyha || null;
    const killipClass = latestAcs?.killip || null;

    // Dynamic LVEF Trajectory across all chronological encounters with valid LVEF
    const allLvefEncounters = allEncounters.filter(e => e.lvef !== null && !isNaN(e.lvef) && e.lvef >= 10 && e.lvef <= 90);
    const latestLvef = allLvefEncounters.length > 0 ? allLvefEncounters[allLvefEncounters.length - 1].lvef : null;
    const baselineLvef = allLvefEncounters.length > 1 ? allLvefEncounters[0].lvef : latestLvef;
    const lvefDelta = (latestLvef !== null && baselineLvef !== null && allLvefEncounters.length > 1) ? (latestLvef - baselineLvef) : null;
    const hfType = latestLvef !== null ? (latestLvef < 40 ? 'HFrEF' : (latestLvef < 50 ? 'HFmrEF' : 'HFpEF')) : (latestHf ? 'Heart Failure' : null);

    // Culprit vessel & Stent specs
    const culpritVessel = latestAcs?.vessel || null;
    const stentSpecs = latestAcs?.stent || (totalStents > 0 ? 'Stent Deployed' : null);
    const d2bTime = latestAcs?.d2b ?? null;
    const d2nTime = latestAcs?.d2n ?? null;
    const timiFlow = latestAcs?.timiFlow ? `Grade ${latestAcs.timiFlow}` : null;

    // Dynamic Echo Findings (Wall motion and valves)
    const latestEchoEnc = summaryEncounters.find(e => e.echoFindings && !e.echoFindings.includes('not recorded'));
    const wallMotion = latestEchoEnc?.raw?.echo_other || latestEchoEnc?.raw?.cardiac?.echoRwmi || (latestLvef !== null ? 'Preserved Wall Motion' : 'Not Recorded');
    const valves = latestEchoEnc?.raw?.mr_moderate === 'Yes' ? 'Moderate MR' : (latestEchoEnc?.raw?.mr_severe === 'Yes' ? 'Severe MR' : (latestEchoEnc?.raw?.mr_mild === 'Yes' ? 'Mild MR' : (latestEchoEnc?.raw?.cardiac?.echoMrMitralRegurg ? `MR (${latestEchoEnc.raw.cardiac.echoMrMitralRegurg})` : (latestLvef !== null ? 'Preserved Valves' : 'Not Recorded'))));

    // Dynamic Rhythm & Conduction
    const latestEcgEnc = summaryEncounters.find(e => e.ecgFindings && !e.ecgFindings.includes('not documented'));
    let rhythm = 'Normal Sinus Rhythm';
    let conduction = 'Normal Conduction';
    if (latestEcgEnc?.ecgFindings) {
        const parts = latestEcgEnc.ecgFindings.split(', ');
        rhythm = parts[0] || 'Normal Sinus Rhythm';
        conduction = parts.length > 1 ? parts.slice(1).join(', ') : 'Normal Conduction';
    }

    // Device Candidacy
    let deviceCandidacy = 'Echo required to assess';
    if (latestLvef !== null) {
        if (latestLvef <= 35) deviceCandidacy = 'ICD/CRT-D Candidate (EF ≤ 35%)';
        else if (latestLvef <= 40) deviceCandidacy = 'Borderline EF Window (36-40%)';
        else deviceCandidacy = 'Defer CRT-D (EF > 40%)';
    }

    // Alerts across the recent summary encounters
    const hasShock = summaryEncounters.some(e => (e.sbp !== null && e.sbp < 90) || e.killip === 'Class IV' || e.killip === 'Class IV (Shock)' || (e.complications && e.complications.some(c => String(c).toLowerCase().includes('shock'))) || (e.raw && e.raw.cardiogenic_shock === 'Yes'));
    const validHbs = summaryEncounters.map(e => e.hb).filter(v => v !== null && !isNaN(v) && v >= 3.0 && v <= 25.0);
    const nadirHb = (validHbs.length > 0 && Math.min(...validHbs) < 10.0) ? Math.min(...validHbs) : null;
    const currentHb = latestEncounter?.hb ?? (validHbs.length > 0 ? validHbs[0] : null);
    const hasRf = patient.renal_failure === 'Yes';
    const isDialysis = patient.active_dialysis_status === 'Under Dialysis' || patient.dialysisStatus === 'Yes' || patient.active_dialysis_status === 'Yes';
    const serumCr = latestEncounter?.cr ?? null;
    const serumK = latestEncounter?.k ?? null;

    // Reconciled Pharmacotherapy from recent real records
    const hfMeds = extractHfMedications(recentHfEncounters.map(e => e.raw || e));
    const acsMeds = extractAcsMedications(recentAcsList.map(e => e.raw || e));
    const hfRegimenText = hfMeds.length > 0 ? hfMeds.join(', ') : 'No HF GDMT medications recorded';
    const acsRegimenText = acsMeds.length > 0 ? acsMeds.join(', ') : 'No ACS discharge medications recorded';

    // DAPT calculation from most recent stented event
    let daptDays = null;
    let daptExpiryDate = null;
    if (latestAcs && (latestAcs.stent || latestAcs.strategy === 'Primary PCI')) {
        const acsDateObj = new Date(latestAcs.date || latestAcs.admission_date || 0);
        if (!isNaN(acsDateObj.getTime())) {
            const diffDays = Math.max(1, Math.floor((Date.now() - acsDateObj.getTime()) / (1000 * 60 * 60 * 24)));
            daptDays = diffDays;
            const exp = new Date(acsDateObj.getTime() + 365 * 24 * 60 * 60 * 1000);
            daptExpiryDate = formatDossierDate(exp);
        }
    }

    // Coronary Intervention Ledger (From recent ACS Events)
    const revascularizationLedger = recentAcsList.map(st => {
        const encDate = st.date || st.admission_date || st.event_date || st.created_at;
        return {
            date: formatDossierDate(encDate),
            recordId: st.registryNo || st.acs_no || `ACS.${st.id || st.stemi_id || st.nstemi_id}`,
            type: st.type,
            targetVessel: st.vessel || 'Not specified',
            strategy: st.strategy || (st.pami === 'Yes' ? 'Primary PCI' : (st.thrombolysis === 'Yes' ? 'Thrombolysis' : 'Conservative')),
            stentSpecs: st.stent || (st.pami === 'Yes' ? 'Stent Deployed' : 'No Stent'),
            d2b: st.d2b ?? null,
            d2n: st.d2n ?? null,
            timiFlow: st.timiFlow ? (String(st.timiFlow).startsWith('Grade') ? st.timiFlow : `Grade ${st.timiFlow}`) : 'Grade 3',
            complications: (st.complications && st.complications.length > 0) ? st.complications.join(', ') : 'None reported'
        };
    });

    // Detailed Episode Dossiers (Recent encounters: each up to 3 HF, STEMI, NSTEMI)
    const episodeDossiers = summaryEncounters.map((enc, idx) => {
        const epNum = summaryEncounters.length - idx;
        return {
            episodeNumber: epNum,
            type: enc.type,
            recordId: enc.registryNo,
            ipNo: enc.ipNo,
            date: enc.formattedDate,
            stayDays: enc.stayDays,
            lvef: enc.lvef,
            diagnosis: enc.diagnosis,
            presentationSymptoms: enc.presentationSymptoms,
            admissionVitals: enc.admissionVitals,
            stratification: enc.timiScoreText !== 'N/A (HF Protocol)' ? `TIMI Risk Score: ${enc.timiScoreText}.` : 'HF Clinical Stratification',
            timiScoreText: enc.timiScoreText,
            ecgFindings: enc.ecgFindings,
            echoFindings: enc.echoFindings,
            labsFindings: enc.labsFindings,
            primaryReperfusion: enc.primaryReperfusion,
            catheterization: enc.catheterization,
            proceduralSuccess: enc.proceduralSuccess,
            complicationsManaged: enc.complicationsManaged,
            treatmentReperfusion: enc.primaryReperfusion,
            inHospitalCourse: `Complications Managed: ${enc.complicationsManaged}.`
        };
    });

    // Determine most frequent treating cardiologist across all encounters
    const consultantCounts = {};
    allEncounters.forEach(e => {
        const c = e.raw?.primary_consultant || e.raw?.treating_cardiologist || e.consultant;
        if (c && typeof c === 'string' && c.trim() && !c.includes('Unknown') && !c.includes('Cardiology Service')) {
            consultantCounts[c.trim()] = (consultantCounts[c.trim()] || 0) + 1;
        }
    });
    let topConsultant = patient.primary_consultant;
    let maxC = 0;
    for (const [c, cnt] of Object.entries(consultantCounts)) {
        if (cnt > maxC) {
            maxC = cnt;
            topConsultant = c;
        }
    }
    const cleanUhid = patient.uhid || (patient.mr_no ? patient.mr_no : 'MR00001');

    // Return the full longitudinal clinical dossier
    return {
        patient: {
            id: String(patient.reg_patient_id),
            name: patient.patient_name || patient.name,
            dob: patient.date_of_birth || patient.dob,
            age: patient.age || null,
            gender: patient.gender || 'Unknown',
            mrNo: patient.mr_no || null,
            uhid: cleanUhid,
            phone: patient.phone_no || patient.phone || null,
            insuranceMode: patient.insurance_mode || null,
            primaryConsultant: topConsultant || patient.primary_consultant || null,
            address: patient.address || null
        },
        comorbidities: {
            hypertension: patient.hypertension || 'Unknown',
            diabetes: patient.diabetes || 'Unknown',
            smoking: patient.smoking || 'Unknown',
            renalFailure: patient.renal_failure || 'Unknown',
            dialysisStatus: patient.active_dialysis_status === 'Under Dialysis' ? 'Yes' : 'No'
        },
        counts: {
            hfCount: hfAssessments.length,
            stemiCount: stemiRecords.length,
            nstemiCount: nstemiRecords.length,
            hospitalDays: totalHospitalDays,
            pcis: totalPcis,
            stents: totalStents,
            thrombolysis: totalThrombolysis,
            inHospitalDeath: inHospitalDeaths
        },
        vitals: {
            sbp: bpSys,
            dbp: bpDia,
            heartRate,
            weight: patientWeight,
            nyhaClass,
            killipClass
        },
        triad: {
            latestLvef,
            baselineLvef,
            lvefDelta,
            hfType,
            culpritVessel: culpritVessel || (totalPcis > 0 ? 'Vessel not recorded' : 'None'),
            stentSpecs: stentSpecs || 'No Stent Deployed',
            d2bTime,
            d2nTime,
            timiFlow,
            wallMotion,
            valves,
            rhythm,
            conduction,
            deviceCandidacy
        },
        alerts: {
            hasShock,
            nadirHb,
            currentHb,
            hasRf,
            isDialysis,
            serumCr,
            serumK
        },
        medications: {
            hfRegimen: hfRegimenText,
            acsRegimen: acsRegimenText,
            daptDays,
            daptTargetDays: 365,
            daptExpiryDate
        },
        chartData,
        revascularizationLedger,
        episodeDossiers
    };
}


module.exports = {
    registerPatient,
    insertPatientStaging,
    getOrCreatePatientStaging,
    updatePatientStaging,
    getStagingPatientById,
    registerWithStagingIntercept,
    resolveStagingPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts,
    getAllPatientCounts,
    verifyPatientIdentity,
    confirmMatch,
    rejectMatch,
    getAuditHistory,
    getLongitudinalDossier
};
