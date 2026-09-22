
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const {
  sendPasswordResetEmail,
} = require("../services/emailService");

// =====================================
// PASSWORD VALIDATION
// =====================================

const validatePassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 8
  ) {
    return "Password must be at least 8 characters long.";
  }

  if (password.length > 128) {
    return "Password cannot exceed 128 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return null;
};

// =====================================
// EMAIL VALIDATION
// =====================================

const isValidEmail = (email) => {
  if (
    typeof email !== "string" ||
    email.length > 254
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

// =====================================
// JWT
// =====================================

const generateToken = (
  userId,
  tokenVersion = 0
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      id: userId,
      tokenVersion,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================
// FORMAT USER
// =====================================

const formatUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    phone: user.phone,
    address: user.address,
    website: user.website,
    gstNumber: user.gstNumber,
    panNumber: user.panNumber,
    currency: user.currency,
    logoUrl: user.logoUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// =====================================
// REGISTER
// =====================================

const registerUser = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      phone,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters long.",
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 50 characters.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await User.create({
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        businessName:
          typeof businessName ===
          "string"
            ? businessName
                .trim()
                .slice(0, 100)
            : "",
        phone:
          typeof phone ===
          "string"
            ? phone
                .trim()
                .slice(0, 20)
            : "",
        currency: "INR",
        tokenVersion: 0,
      });

    const token = generateToken(
      user._id,
      user.tokenVersion
    );

    return res.status(201).json({
      success: true,
      message:
        "Registration successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    /*
     * Handles a race condition where
     * two registrations use the same email.
     */
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create your account.",
    });
  }
};

// =====================================
// LOGIN
// =====================================

const loginUser = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const tokenVersion =
      Number(
        user.tokenVersion || 0
      );

    const token =
      generateToken(
        user._id,
        tokenVersion
      );

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login right now.",
    });
  }
};

// =====================================
// FORGOT PASSWORD
// =====================================

const forgotPassword = async (
  req,
  res
) => {
  try {
    const { email } =
      req.body || {};

    if (
      typeof email !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required.",
      });
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    const genericMessage =
      "If an account exists with this email, a password reset link has been sent.";

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select(
        "+passwordResetToken +passwordResetExpires"
      );

    /*
     * Do not reveal whether an
     * account exists.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const expiresAt =
      new Date(
        Date.now() +
          15 * 60 * 1000
      );

    user.passwordResetToken =
      hashedToken;

    user.passwordResetExpires =
      expiresAt;

    await user.save();

    const clientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      user.passwordResetToken = "";
      user.passwordResetExpires =
        null;

      await user.save();

      console.error(
        "Forgot password email error:",
        emailError
      );

      return res.status(503).json({
        success: false,
        message:
          "Unable to send the password reset email right now. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process your request right now.",
    });
  }
};

// =====================================
// RESET PASSWORD
// =====================================

const resetPassword = async (
  req,
  res
) => {
  try {
    const { token } =
      req.params;

    const {
      password,
      confirmPassword,
    } = req.body || {};

    if (
      typeof token !== "string" ||
      !token
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset token is required.",
      });
    }

    if (
      typeof password !==
        "string" ||
      typeof confirmPassword !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password and confirmation password are required.",
      });
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    if (
      password !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user =
      await User.findOne({
        passwordResetToken:
          hashedToken,

        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select(
        "+passwordResetToken +passwordResetExpires"
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    user.password =
      hashedPassword;

    /*
     * Invalidate the reset token.
     */
    user.passwordResetToken = "";

    user.passwordResetExpires =
      null;

    /*
     * Invalidate ALL previously
     * issued JWT sessions.
     */
    user.tokenVersion =
      Number(
        user.tokenVersion || 0
      ) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset your password right now.",
    });
  }
};

// =====================================
// GET PROFILE
// =====================================

const getUserProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch your profile.",
    });
  }
};

// =====================================
// UPDATE PROFILE
// =====================================

const updateUserProfile = async (
  req,
  res
) => {
  try {
    const {
      name,
      businessName,
      phone,
      address,
      website,
      gstNumber,
      panNumber,
      currency,
    } = req.body || {};

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be text.",
        });
      }

      const trimmedName =
        name.trim();

      if (
        trimmedName.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be at least 2 characters long.",
        });
      }

      if (
        trimmedName.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot exceed 50 characters.",
        });
      }

      user.name =
        trimmedName;
    }

    if (
      businessName !== undefined
    ) {
      if (
        typeof businessName !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Business name must be text.",
        });
      }

      user.businessName =
        businessName
          .trim()
          .slice(0, 100);
    }

    if (phone !== undefined) {
      if (
        typeof phone !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must be text.",
        });
      }

      user.phone =
        phone
          .trim()
          .slice(0, 20);
    }

    if (
      address !== undefined
    ) {
      if (
        typeof address !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Address must be text.",
        });
      }

      user.address =
        address
          .trim()
          .slice(0, 300);
    }

    if (
      website !== undefined
    ) {
      if (
        typeof website !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Website must be text.",
        });
      }

      user.website =
        website
          .trim()
          .slice(0, 200);
    }

    if (
      gstNumber !== undefined
    ) {
      if (
        typeof gstNumber !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "GST number must be text.",
        });
      }

      user.gstNumber =
        gstNumber
          .trim()
          .toUpperCase()
          .slice(0, 20);
    }

    if (
      panNumber !== undefined
    ) {
      if (
        typeof panNumber !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "PAN number must be text.",
        });
      }

      user.panNumber =
        panNumber
          .trim()
          .toUpperCase()
          .slice(0, 20);
    }

    if (
      currency !== undefined
    ) {
      const allowedCurrencies = [
        "INR",
        "USD",
        "EUR",
        "GBP",
        "AED",
      ];

      if (
        !allowedCurrencies.includes(
          currency
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid currency.",
        });
      }

      user.currency =
        currency;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: formatUser(user),
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update your profile.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
};