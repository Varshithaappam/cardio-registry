const hfService = require("../services/hfService");

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
    const { patientId, patient_id, hf_id, created_by, updated_by, isDraft, ...formFields } = body;
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
        const userId = req.user?.id || req.user?.userId || 1;
        console.log("Saving HF Assessment for patient_id:", req.body.patientId, "User ID:", userId);
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
        const patientId = req.params.patientId;
        console.log("Retrieving HF history for patientId:", patientId);
        const result = await hfService.getHfHistory(patientId);
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
        const userId = req.user?.id || req.user?.userId || 1;
        console.log("Saving HF Assessment Draft for patient_id:", req.body.patientId, "User ID:", userId);
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
