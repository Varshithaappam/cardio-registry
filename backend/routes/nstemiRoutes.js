const express = require('express');
const router = express.Router();
const { createNstemiRecord } = require('../controllers/nstemiController');

// POST /api/nstemi - Submit new NSTEMI registry record
router.post('/', createNstemiRecord);

module.exports = router;
