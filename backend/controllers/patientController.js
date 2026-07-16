const patientService = require("../services/patientService");
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
 * Register New Patient
 */
async function registerPatient(req, res) {
    try {
        const patient = await patientService.registerPatient(req.body);

        return res.status(201).json({
            success: true,
            message: "Patient registered successfully.",
            data: patient
        });
    } catch (error) {
        return handlePatientError(res, error, "Register Patient");
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
        const patientId = req.params.id;
        const patient = await patientService.getPatientById(patientId);

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
        const patientId = req.params.id;
        const patient = await patientService.updatePatient(
            patientId,
            req.body
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
        const patientId = req.params.id;
        const result = await patientService.deletePatient(patientId);

        if (result.affectedRows === 0) {
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

module.exports = {
    registerPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
};
