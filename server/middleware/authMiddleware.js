
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication service is not configured correctly.",
      });
    }

    let token;

    // =====================================
    // GET TOKEN FROM AUTHORIZATION HEADER
    // =====================================

    const authorization =
      req.headers.authorization;

    if (
      authorization &&
      authorization.startsWith("Bearer ")
    ) {
      token = authorization
        .slice(7)
        .trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Token not provided.",
      });
    }

    // =====================================
    // VERIFY JWT
    // =====================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Invalid token.",
      });
    }

    // =====================================
    // FIND USER
    // =====================================

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User associated with this token no longer exists.",
      });
    }

    // =====================================
    // SESSION INVALIDATION
    // =====================================

    /*
     * JWTs created before tokenVersion was
     * introduced intentionally become invalid.
     *
     * This also invalidates every existing
     * session after a password reset.
     */
    const currentTokenVersion =
      Number(user.tokenVersion || 0);

    const tokenVersion =
      Number(decoded.tokenVersion);

    if (
      !Number.isInteger(tokenVersion) ||
      tokenVersion !== currentTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your session is no longer valid. Please sign in again.",
      });
    }

    // =====================================
    // ATTACH USER
    // =====================================

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your session has expired. Please sign in again.",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name ===
        "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Invalid token.",
      });
    }

    console.error(
      "Authentication Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Not authorized. Invalid or expired token.",
    });
  }
};

module.exports = protect;