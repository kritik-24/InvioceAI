
const express = require("express");

const {
  chatWithBusinessAssistant,
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// AI BUSINESS ASSISTANT
// =====================================

router.post(
  "/chat",
  protect,
  chatWithBusinessAssistant
);

module.exports = router;