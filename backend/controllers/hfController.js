const hfService = require("../services/hfService");

async function saveHfAssessment(req, res) {
    try {
        console.log("Saving HF Assessment for patient_id:", req.body.patientId);
        const result = await hfService.saveHfAssessment(req.body);
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

module.exports = {
    saveHfAssessment
};
