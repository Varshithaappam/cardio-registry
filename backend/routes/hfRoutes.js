const express = require("express");
const router = express.Router();
const hfController = require("../controllers/hfController");

router.post("/draft", hfController.saveHfDraft);
router.put("/draft", hfController.saveHfDraft);
router.post("/", hfController.saveHfAssessment);
router.put("/", hfController.saveHfAssessment);
router.post("/:hf_id", hfController.saveHfAssessment);
router.put("/:hf_id", hfController.saveHfAssessment);
router.get("/:hf_id", hfController.getHfAssessment);

module.exports = router;
