const patientService = require("../services/patientService");
const patientMatchAuditService = require("../services/patientMatchAuditService");
const { mapDatabaseError } = require("../utils/patientValidation");

function handlePatientError(res, error, action) {
    console.error(`${action} Error:`, {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage
    });

    if (error.message && !error.code) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    const mappedError = mapDatabaseError(error);

    return res.status(mappedError.status).json({
        success: false,
        message: mappedError.message
    });
}

/**
 * Step 1: Register New Patient via Staging Intercept
 */
async function registerPatient(req, res) {
    try {
        const user = req.user || { id: 1, name: 'Nurse / User' };
        const userId = user?.id || user?.userId || 1;
        const confirmOverride = req.query.confirm_no_existing_match === 'true' || 
                                req.body.confirm_no_existing_match === true ||
                                req.body.force_create === true;

        // If clinical safety override is confirmed (e.g. user clicked "Force Register as New Record")
        if (confirmOverride) {
            const stagingId = await patientService.insertPatientStaging(req.body);
            const newPatient = await patientService.registerPatient(req.body, userId);
            await patientService.updatePatientStaging(stagingId, 'RESOLVED', 'MANUAL_CREATED', newPatient.reg_patient_id);
            
            // Log clinical override audit
            try {
                await patientMatchAuditService.logMatchAudit({
                    incoming_patient_id: stagingId,
                    reg_patient_id: newPatient.reg_patient_id,
                    candidate_patient_id: req.body.candidate_patient_id || null,
                    action: 'FORCE_CREATE',
                    decision: 'CONFIRMED_DIFFERENT_PATIENT',
                    user_decision: 'MANUAL_CREATED',
                    overall_score: 0.0,
                    reasons: ['User confirmed clinical safety override and forced registration'],
                    created_by: user.name || `User_${userId}`
                });
            } catch (auditErr) {
                console.error("Audit log error on force create:", auditErr);
            }

            return res.status(201).json({
                success: true,
                message: "Patient registered successfully under clinical safety override.",
                staging_id: stagingId,
                data: newPatient
            });
        }

        const result = await patientService.registerWithStagingIntercept(req.body, user);

        if (result.statusCode === 201) {
            return res.status(201).json({
                success: true,
                message: "Patient registered successfully.",
                staging_id: result.staging_id,
                data: result.data
            });
        }

        // Return 409 Conflict with staging_id, status ('REVIEW_REQUIRED' or 'HIGH_CONFIDENCE_MATCH'), and matched patient data
        return res.status(409).json({
            success: false,
            status: result.status,
            decision: result.status,
            staging_id: result.staging_id,
            confidence: result.confidence,
            matched_patient: result.matched_patient,
            candidates: result.candidates,
            verification_id: result.verification_id,
            message: result.status === 'HIGH_CONFIDENCE_MATCH'
                ? "Duplicate patient record detected with high confidence."
                : "Potential existing patient match found. Review required."
        });
    } catch (error) {
        return handlePatientError(res, error, "Register Patient with Staging Intercept");
    }
}

/**
 * Step 3: Resolution Endpoint Controller (POST /api/resolve-staging)
 */
async function resolveStaging(req, res) {
    try {
        const user = req.user || { id: 1, name: 'Nurse / User' };
        const { staging_id, action, target_patient_id } = req.body;

        if (!staging_id || !action) {
            return res.status(400).json({
                success: false,
                message: "Both 'staging_id' and 'action' ('FORCE_CREATE' or 'MERGE') are required."
            });
        }

        const result = await patientService.resolveStagingPatient({
            staging_id: parseInt(staging_id, 10),
            action: action.toUpperCase(),
            target_patient_id: target_patient_id ? parseInt(target_patient_id, 10) : null,
            user
        });

        const statusCode = result.action === 'MANUAL_CREATED' ? 201 : 200;
        return res.status(statusCode).json(result);
    } catch (error) {
        return handlePatientError(res, error, "Resolve Staging Patient");
    }
}

/**
 * Verify Patient Identity (Pre-registration check)
 */
async function verifyPatient(req, res) {
    try {
        const user = req.user || { id: 1, name: 'Nurse / User' };
        const result = await patientService.verifyPatientIdentity(req.body, user);

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        return handlePatientError(res, error, "Verify Patient Identity");
    }
}

/**
 * Confirm Patient Match (Link/Use Existing Patient)
 */
async function confirmMatch(req, res) {
    try {
        const user = req.user || { id: 1, name: 'Nurse / User' };
        const candidateId = req.params.id || req.body.candidate_patient_id;
        const result = await patientService.confirmMatch({
            ...req.body,
            candidate_patient_id: candidateId
        }, user);

        return res.status(200).json({
            success: true,
            message: "Patient match confirmed successfully.",
            data: result
        });
    } catch (error) {
        return handlePatientError(res, error, "Confirm Patient Match");
    }
}

/**
 * Reject Patient Match (Mark as Different Person)
 */
async function rejectMatch(req, res) {
    try {
        const user = req.user || { id: 1, name: 'Nurse / User' };
        const candidateId = req.params.id || req.body.candidate_patient_id;
        const result = await patientService.rejectMatch({
            ...req.body,
            candidate_patient_id: candidateId
        }, user);

        return res.status(200).json({
            success: true,
            message: "Candidate marked as different patient.",
            data: result
        });
    } catch (error) {
        return handlePatientError(res, error, "Reject Patient Match");
    }
}

/**
 * Get Identity Matching Audit Trail
 */
async function getAuditLogs(req, res) {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = parseInt(req.query.offset, 10) || 0;
        const patientId = req.query.patient_id ? parseInt(req.query.patient_id, 10) : null;

        const auditData = await patientService.getAuditHistory({ limit, offset, patientId });

        return res.status(200).json({
            success: true,
            ...auditData
        });
    } catch (error) {
        return handlePatientError(res, error, "Get Patient Match Audit");
    }
}

/**
 * Get All Patients
 */
async function getAllPatients(req, res) {
    try {
        const patients = await patientService.getAllPatients();

        return res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (error) {
        return handlePatientError(res, error, "Get Patients");
    }
}

/**
 * Get Patient By ID
 */
async function getPatientById(req, res) {
    try {
        const regPatientId = req.params.id;
        const patient = await patientService.getPatientById(regPatientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: patient
        });
    } catch (error) {
        return handlePatientError(res, error, "Get Patient");
    }
}

/**
 * Update Patient
 */
async function updatePatient(req, res) {
    try {
        const regPatientId = req.params.id;
        const userId = req.user?.id || req.user?.userId || 1;
        const patient = await patientService.updatePatient(
            regPatientId,
            req.body,
            userId
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully.",
            data: patient
        });
    } catch (error) {
        return handlePatientError(res, error, "Update Patient");
    }
}

/**
 * Delete Patient
 */
async function deletePatient(req, res) {
    try {
        const regPatientId = req.params.id;
        const userId = req.user?.id || req.user?.userId || 1;
        const result = await patientService.deletePatient(regPatientId, userId);

        if ((result.rowsAffected?.[0] || 0) === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient deleted successfully."
        });
    } catch (error) {
        return handlePatientError(res, error, "Delete Patient");
    }
}

async function getPatientCounts(req, res) {
    try {
        const regPatientId = req.params.regPatientId;
        const counts = await patientService.getPatientCounts(regPatientId);
        return res.status(200).json({
            success: true,
            data: counts
        });
    } catch (error) {
        return handlePatientError(res, error, "Get Patient Counts");
    }
}

module.exports = {
    registerPatient,
    resolveStaging,
    verifyPatient,
    confirmMatch,
    rejectMatch,
    getAuditLogs,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientCounts
};
