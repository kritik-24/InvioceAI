
const express = require("express");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const {
  loginRateLimiter,
  signupRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/register",
  signupRateLimiter,
  registerUser
);

router.post(
  "/login",
  loginRateLimiter,
  loginUser
);

router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordRateLimiter,
  resetPassword
);

router.get(
  "/profile",
  protect,
  getUserProfile
);

router.put(
  "/profile",
  protect,
  updateUserProfile
);

router.get(
  "/protected",
  protect,
  (req, res) => {
    res.status(200).json({
      message:
        "You successfully accessed a protected route!",
      user: req.user,
    });
  }
);

module.exports = router;