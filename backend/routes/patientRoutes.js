const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

/**
 * Patient Routes
 */

// Verify Patient Identity (Pre-registration check)
router.post("/verify", authenticateToken, patientController.verifyPatient);

// Resolve Staging (Action: FORCE_CREATE or MERGE)
router.post("/resolve-staging", authenticateToken, patientController.resolveStaging);

// Register New Patient
router.post("/register", authenticateToken, patientController.registerPatient);
router.post("/", authenticateToken, patientController.registerPatient);

// Confirm / Reject Matches (Audit & Action)
router.post("/confirm-match", authenticateToken, patientController.confirmMatch);
router.post("/:id/confirm-match", authenticateToken, patientController.confirmMatch);
router.post("/reject-match", authenticateToken, patientController.rejectMatch);
router.post("/:id/reject-match", authenticateToken, patientController.rejectMatch);

// Get Patient Match Audit History (Restricted to ADMIN)
router.get("/audit", authenticateToken, requireRole('ADMIN'), patientController.getAuditLogs);

// Get Patient Counts
router.get("/counts/all", authenticateToken, patientController.getAllPatientCounts);
router.get("/counts/:regPatientId", authenticateToken, patientController.getPatientCounts);

// GDMT Clinical Intelligence & Cohort Analytics Endpoints (Protected by authenticateToken)
router.get("/gdmt-cohort", authenticateToken, patientController.getGdmtCohort);
router.get("/hf-export-sheet1", authenticateToken, patientController.getHfSheet1Export);
router.get("/stemi-cohort", authenticateToken, patientController.getStemiCohort);
router.get("/nstemi-cohort", authenticateToken, patientController.getNstemiCohort);

// Get All Patients
router.get("/", authenticateToken, patientController.getAllPatients);

// Get Comprehensive Longitudinal Clinical Dossier
router.get("/:id/longitudinal-dossier", authenticateToken, patientController.getLongitudinalDossier);

// Get Patient By ID
router.get("/:id", authenticateToken, patientController.getPatientById);

// Update Patient
router.put("/:id", authenticateToken, patientController.updatePatient);

// Delete Patient (Restricted to ADMIN, CLINICIAN)
router.delete("/:id", authenticateToken, requireRole('ADMIN', 'CLINICIAN'), patientController.deletePatient);

module.exports = router;