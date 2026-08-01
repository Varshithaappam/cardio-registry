const express = require('express');
const router = express.Router();
const hfRegistryController = require('../controllers/hfRegistryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Create Record (POST /api/hf-registry)
router.post(
  '/', 
  authenticateToken, 
  requireRole('ADMIN', 'CLINICIAN', 'DATA_ENTRY'), 
  hfRegistryController.createRecord
);

// Update Record (PUT /api/hf-registry/:id)
router.put(
  '/:id', 
  authenticateToken, 
  requireRole('ADMIN', 'CLINICIAN', 'DATA_ENTRY'), 
  hfRegistryController.updateRecord
);

// Delete Record (DELETE /api/hf-registry/:id)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN', 'CLINICIAN'),
  hfRegistryController.deleteRecord
);

// Patient Audit Log Route (GET /api/hf-registry/patient/:patientId/audit)
router.get(
  '/patient/:patientId/audit',
  authenticateToken,
  requireRole('ADMIN', 'CLINICIAN'),
  hfRegistryController.getPatientAuditLog
);

// Audit Log Viewer Route (GET /api/hf-registry/:id/audit)
router.get(
  '/:id/audit', 
  authenticateToken, 
  requireRole('ADMIN', 'CLINICIAN'), 
  hfRegistryController.getAuditLog
);

module.exports = router;
