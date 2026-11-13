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
const { authenticateToken } = require('../middleware/authMiddleware');
const { getNstemiCohortFromDb } = require('../services/acsService');

// GET /api/nstemi/cohort - Retrieve full NSTEMI cohort analytics records
router.get('/cohort', async (req, res) => {
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

// DELETE /api/nstemi/:id - Soft delete NSTEMI record
router.delete('/:id', authenticateToken, deleteNstemiRecord);

// PATCH / PUT /api/nstemi/:id/undelete - Restore / Undelete NSTEMI record
router.patch('/:id/undelete', authenticateToken, undeleteNstemiRecord);
router.put('/:id/undelete', authenticateToken, undeleteNstemiRecord);

module.exports = router;
