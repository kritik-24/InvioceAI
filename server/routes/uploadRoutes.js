
const express = require("express");

const {
  uploadBusinessLogo,
  removeBusinessLogo,
} = require("../controllers/uploadController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =====================================
// BUSINESS LOGO
// =====================================

router.post(
  "/business-logo",
  protect,
  upload.single("logo"),
  uploadBusinessLogo
);

router.delete(
  "/business-logo",
  protect,
  removeBusinessLogo
);

module.exports = router;