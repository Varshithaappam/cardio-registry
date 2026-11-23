const express = require('express');
const router = express.Router();
const { 
  createStemiRecord, 
  getStemiHistory, 
  getStemiRecord, 
  updateStemiRecord, 
  deleteStemiRecord,
  undeleteStemiRecord
} = require('../controllers/stemiController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { getStemiCohortFromDb } = require('../services/acsService');

// GET /api/stemi/cohort - Retrieve full STEMI cohort analytics records (Protected by authenticateToken)
router.get('/cohort', authenticateToken, async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted !== 'false';
    const data = await getStemiCohortFromDb(includeDeleted);
    const activeCount = data.filter(p => !p.isDeleted).length;
    res.json({ success: true, count: data.length, activeCount, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stemi - Submit new STEMI registry record
router.post('/', authenticateToken, createStemiRecord);

// GET /api/stemi/history/:regPatientId - Retrieve STEMI history list for patient
router.get('/history/:regPatientId', authenticateToken, getStemiHistory);

// GET /api/stemi/:id - Retrieve single full STEMI record
router.get('/:id', authenticateToken, getStemiRecord);

// PUT /api/stemi/:id - Update existing STEMI record
router.put('/:id', authenticateToken, updateStemiRecord);

// DELETE /api/stemi/:id - Soft delete STEMI record (Restricted to ADMIN, CLINICIAN)
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), deleteStemiRecord);

// PATCH / PUT /api/stemi/:id/undelete - Restore / Undelete STEMI record (Restricted to ADMIN, CLINICIAN)
router.patch('/:id/undelete', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), undeleteStemiRecord);
router.put('/:id/undelete', authenticateToken, requireRole('ADMIN', 'CLINICIAN'), undeleteStemiRecord);

module.exports = router;
