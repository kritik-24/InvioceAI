
const mongoose = require("mongoose");

// =====================================
// CLIENT SCHEMA
// =====================================
const clientSchema = new mongoose.Schema(
  {
    // =====================================
    // CLIENT OWNER
    // =====================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================
    // BASIC INFORMATION
    // =====================================
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================
    // ADDRESS
    // =====================================
    address: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================
    // TAX INFORMATION
    // =====================================
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // =====================================
    // ADDITIONAL INFORMATION
    // =====================================
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// INDEXES
// =====================================

// Prevent duplicate client emails for the same user
clientSchema.index(
  {
    user: 1,
    email: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      email: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;