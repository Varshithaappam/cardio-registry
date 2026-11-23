const express = require('express');
const router = express.Router();
const executiveDashboardController = require('../controllers/executiveDashboardController');

// GET /api/executive-dashboard/metrics
router.get('/metrics', executiveDashboardController.getExecutiveMetrics);

module.exports = router;
