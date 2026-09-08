
const mongoose = require("mongoose");

// ===============================
// INVOICE ITEM SCHEMA
// ===============================
const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

// ===============================
// INVOICE SCHEMA
// ===============================
const invoiceSchema = new mongoose.Schema(
  {
    // Invoice owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Client information
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },

    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    clientAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Invoice information
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },

    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    // Invoice items
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "At least one invoice item is required",
      },
    },

    // Financial information
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment status
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue"],
      default: "Draft",
    },

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

// ===============================
// UNIQUE INVOICE NUMBER PER USER
// ===============================
invoiceSchema.index(
  { user: 1, invoiceNumber: 1 },
  { unique: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;