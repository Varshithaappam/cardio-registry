const hfService = require("../services/hfService");

async function saveHfAssessment(req, res) {
    try {
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
