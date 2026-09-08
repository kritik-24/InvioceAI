
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token not provided.",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach user information to request
    req.user = await User.findById(decoded.id).select("-password");

    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        message: "User associated with this token no longer exists.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

module.exports = protect;