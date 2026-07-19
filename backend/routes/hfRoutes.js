const express = require("express");
const router = express.Router();
const hfController = require("../controllers/hfController");

router.post("/", hfController.saveHfAssessment);
router.get("/:hf_id", hfController.getHfAssessment);

module.exports = router;
