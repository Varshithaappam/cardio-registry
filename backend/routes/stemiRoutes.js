const express = require('express');
const router = express.Router();
const { createStemiRecord } = require('../controllers/stemiController');

// POST /api/stemi - Submit new STEMI registry record
router.post('/', createStemiRecord);

module.exports = router;
