
const express = require("express");

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// Get logged-in user profile
router.get("/profile", protect, getUserProfile);

// Update logged-in user profile
router.put("/profile", protect, updateUserProfile);

// Temporary protected route for testing JWT
router.get("/protected", protect, (req, res) => {
  res.status(200).json({
    message: "You successfully accessed a protected route!",
    user: req.user,
  });
});

module.exports = router;