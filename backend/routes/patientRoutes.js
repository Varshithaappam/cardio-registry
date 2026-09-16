const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");

/**
 * Patient Routes
 */

// Verify Patient Identity (Pre-registration check)
router.post("/verify", patientController.verifyPatient);

// Resolve Staging (Action: FORCE_CREATE or MERGE)
router.post("/resolve-staging", patientController.resolveStaging);

// Register New Patient
router.post("/register", patientController.registerPatient);
router.post("/", patientController.registerPatient);

// Confirm / Reject Matches (Audit & Action)
router.post("/confirm-match", patientController.confirmMatch);
router.post("/:id/confirm-match", patientController.confirmMatch);
router.post("/reject-match", patientController.rejectMatch);
router.post("/:id/reject-match", patientController.rejectMatch);

// Get Patient Match Audit History
router.get("/audit", patientController.getAuditLogs);

// Get All Patients
router.get("/", patientController.getAllPatients);

// Get Patient By ID
router.get("/:id", patientController.getPatientById);

// Update Patient
router.put("/:id", patientController.updatePatient);

// Delete Patient
router.delete("/:id", patientController.deletePatient);

// Get Patient Counts
router.get("/counts/all", patientController.getAllPatientCounts);
router.get("/counts/:regPatientId", patientController.getPatientCounts);

module.exports = router;