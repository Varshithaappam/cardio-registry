const express = require('express');
const router = express.Router();
const { 
  createNstemiRecord, 
  getNstemiHistory, 
  getNstemiRecord, 
  updateNstemiRecord, 
  deleteNstemiRecord 
} = require('../controllers/nstemiController');
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/nstemi - Submit new NSTEMI registry record
router.post('/', authenticateToken, createNstemiRecord);

// GET /api/nstemi/history/:regPatientId - Retrieve NSTEMI history list for patient
router.get('/history/:regPatientId', authenticateToken, getNstemiHistory);

// GET /api/nstemi/:id - Retrieve single full NSTEMI record
router.get('/:id', authenticateToken, getNstemiRecord);

// PUT /api/nstemi/:id - Update existing NSTEMI record
router.put('/:id', authenticateToken, updateNstemiRecord);

// DELETE /api/nstemi/:id - Hard delete NSTEMI record
router.delete('/:id', authenticateToken, deleteNstemiRecord);

module.exports = router;
