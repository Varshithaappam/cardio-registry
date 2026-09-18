const hfService = require("../services/hfService");
const db = require("../config/db");

async function resolveCurrentUserId(req) {
    if (req.user?.id || req.user?.userId) {
        return req.user.id || req.user.userId;
    }
    const headerName = req.headers['x-user-name'];
    const headerId = req.headers['x-user-id'];
    const bodyUser = req.body?.username || req.body?.user_id || req.body?.userId || req.body?.created_by || req.body?.updated_by;

    const target = headerId || headerName || bodyUser;
    if (target) {
        try {
            const { recordset } = await db.query(
                `SELECT user_id FROM [users] WHERE user_id = @id OR username = @name OR email = @name;`,
                { id: isNaN(Number(target)) ? -1 : Number(target), name: String(target) }
            );
            if (recordset.length > 0) {
                return recordset[0].user_id;
            }
        } catch (err) {
            console.error("Error resolving user id:", err.message);
        }
    }

    try {
        const { recordset } = await db.query(`SELECT TOP 1 user_id FROM [users] WHERE username = 'varshitha_appam';`);
        if (recordset.length > 0) return recordset[0].user_id;
    } catch {}

    return 7;
}

function isFilled(val) {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim() !== '';
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return !isNaN(val);
    if (Array.isArray(val)) return val.some(isFilled);
    if (typeof val === 'object') return Object.values(val).some(isFilled);
    return false;
}

function hasAtLeastOneFilledField(body) {
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
        return false;
    }
    const { regPatientId, reg_patient_id, hf_id, created_by, updated_by, isDraft, ...formFields } = body;
    return Object.values(formFields).some(isFilled);
}

async function saveHfAssessment(req, res) {
    try {
        if (!hasAtLeastOneFilledField(req.body)) {
            return res.status(400).json({
                success: false,
                message: "At least one field must be provided"
            });
        }
        const userId = await resolveCurrentUserId(req);
        console.log("Saving HF Assessment for reg_patient_id:", req.body.regPatientId, "User ID:", userId);
        req.body._req = req;
        const result = await hfService.saveHfAssessment(req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Heart Failure Assessment details saved into database successfully.",
            data: result
        });
    } catch (error) {
        console.error("Error saving HF Assessment:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to save Heart Failure Assessment details."
        });
    }
}

async function getHfAssessment(req, res) {
    try {
        const hf_id = req.params.hf_id;
        console.log("Retrieving HF Assessment details for hf_id:", hf_id);
        const result = await hfService.getHfAssessment(hf_id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Heart Failure Assessment not found."
            });
        }
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error retrieving HF Assessment:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve Heart Failure Assessment details."
        });
    }
}

async function getHfHistory(req, res) {
    try {
        const regPatientId = req.params.regPatientId;
        console.log("Retrieving HF history for regPatientId:", regPatientId);
        const result = await hfService.getHfHistory(regPatientId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error retrieving HF history:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve Heart Failure history."
        });
    }
}

async function saveHfDraft(req, res) {
    try {
        if (!hasAtLeastOneFilledField(req.body)) {
            return res.status(400).json({
                success: false,
                message: "At least one field must be provided"
            });
        }
        const userId = await resolveCurrentUserId(req);
        console.log("Saving HF Assessment Draft for reg_patient_id:", req.body.regPatientId, "User ID:", userId);
        req.body._req = req;
        const result = await hfService.saveHfAssessment({ ...req.body, isDraft: true }, userId);
        return res.status(200).json({
            success: true,
            message: "Heart Failure Assessment draft saved successfully.",
            data: result
        });
    } catch (error) {
        console.error("Error saving HF Assessment draft:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to save draft."
        });
    }
}

module.exports = {
    saveHfAssessment,
    saveHfDraft,
    getHfAssessment,
    getHfHistory
};
