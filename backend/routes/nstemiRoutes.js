const express = require('express');
const router = express.Router();
const { 
  createNstemiRecord, 
  getNstemiHistory, 
  getNstemiRecord, 
  updateNstemiRecord, 
  deleteNstemiRecord,
  undeleteNstemiRecord
} = require('../controllers/nstemiController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { getNstemiCohortFromDb } = require('../services/acsService');

// GET /api/nstemi/cohort - Retrieve full NSTEMI cohort analytics records (Protected by authenticateToken)
router.get('/cohort', authenticateToken, async (req, res) => {
  try {
    const data = await getNstemiCohortFromDb();
    res.json({ success: true, count: data.length, activeCount: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/nstemi - Submit new NSTEMI registry record
router.post('/', authenticateToken, createNstemiRecord);

// GET /api/nstemi/history/:regPatientId - Retrieve NSTEMI history list for patient
router.get('/history/:regPatientId', authenticateToken, getNstemiHistory);

// GET /api/nstemi/:id - Retrieve single full NSTEMI record
router.get('/:id', authenticateToken, getNstemiRecord);

// PUT /api/nstemi/:id - Update existing NSTEMI record
router.put('/:id', authenticateToken, updateNstemiRecord);

// DELETE /api/nstemi/:id - Soft delete NSTEMI record (Restricted to ADMIN, CLINICIAN)
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), deleteNstemiRecord);

// PATCH / PUT /api/nstemi/:id/undelete - Restore / Undelete NSTEMI record (Restricted to ADMIN, CLINICIAN)
router.patch('/:id/undelete', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), undeleteNstemiRecord);
router.put('/:id/undelete', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), undeleteNstemiRecord);

module.exports = router;
