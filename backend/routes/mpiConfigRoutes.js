const express = require('express');
const router = express.Router();
const mpiConfigController = require('../controllers/mpiConfigController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/mpi-config - View active configuration and all rules
router.get('/', mpiConfigController.getConfigs);

// PUT /api/mpi-config/:key - Update a scoring weight, penalty, or threshold (Restricted to ADMIN)
router.put('/:key', requireRole('ADMIN'), mpiConfigController.updateConfig);

// POST /api/mpi-config/refresh - Invalidate in-memory cache and reload (Restricted to ADMIN)
router.post('/refresh', requireRole('ADMIN'), mpiConfigController.refreshCache);

module.exports = router;
