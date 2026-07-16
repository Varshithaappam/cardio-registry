const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");

/**
 * Patient Routes
 */

// Register New Patient
router.post("/", patientController.registerPatient);

// Get All Patients
router.get("/", patientController.getAllPatients);

// Get Patient By ID
router.get("/:id", patientController.getPatientById);

// Update Patient
router.put("/:id", patientController.updatePatient);

// Delete Patient
router.delete("/:id", patientController.deletePatient);

module.exports = router;