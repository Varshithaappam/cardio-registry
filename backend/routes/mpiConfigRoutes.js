const express = require('express');
const router = express.Router();
const mpiConfigController = require('../controllers/mpiConfigController');

// GET /api/mpi-config - View active configuration and all rules
router.get('/', mpiConfigController.getConfigs);

// PUT /api/mpi-config/:key - Update a scoring weight, penalty, or threshold
router.put('/:key', mpiConfigController.updateConfig);

// POST /api/mpi-config/refresh - Invalidate in-memory cache and reload
router.post('/refresh', mpiConfigController.refreshCache);

module.exports = router;
