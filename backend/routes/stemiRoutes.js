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
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/stemi - Submit new STEMI registry record
router.post('/', authenticateToken, createStemiRecord);

// GET /api/stemi/history/:regPatientId - Retrieve STEMI history list for patient
router.get('/history/:regPatientId', authenticateToken, getStemiHistory);

// GET /api/stemi/:id - Retrieve single full STEMI record
router.get('/:id', authenticateToken, getStemiRecord);

// PUT /api/stemi/:id - Update existing STEMI record
router.put('/:id', authenticateToken, updateStemiRecord);

// DELETE /api/stemi/:id - Soft delete STEMI record
router.delete('/:id', authenticateToken, deleteStemiRecord);

// PATCH / PUT /api/stemi/:id/undelete - Restore / Undelete STEMI record
router.patch('/:id/undelete', authenticateToken, undeleteStemiRecord);
router.put('/:id/undelete', authenticateToken, undeleteStemiRecord);

module.exports = router;
