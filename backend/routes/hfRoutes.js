const express = require("express");
const router = express.Router();
const hfController = require("../controllers/hfController");

router.post("/", hfController.saveHfAssessment);

module.exports = router;
