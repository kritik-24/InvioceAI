
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================
    // ACCOUNT INFORMATION
    // =====================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },

    // =====================================
    // SESSION SECURITY
    // =====================================

    /*
     * Incrementing this value invalidates all
     * previously issued JWTs for the user.
     *
     * It is incremented after a successful
     * password reset.
     */
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================
    // PASSWORD RESET
    // =====================================

    passwordResetToken: {
      type: String,
      default: "",
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // =====================================
    // BUSINESS INFORMATION
    // =====================================

    businessName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        100,
        "Business name cannot exceed 100 characters",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        20,
        "Phone number cannot exceed 20 characters",
      ],
    },

    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        300,
        "Address cannot exceed 300 characters",
      ],
    },

    website: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        200,
        "Website cannot exceed 200 characters",
      ],
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      maxlength: [
        20,
        "GST number cannot exceed 20 characters",
      ],
    },

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      maxlength: [
        20,
        "PAN number cannot exceed 20 characters",
      ],
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP", "AED"],
    },

    // =====================================
    // BRANDING
    // =====================================

    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    logoPublicId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;