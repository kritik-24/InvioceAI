
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
// PAYMENT HISTORY SCHEMA
// ===============================
const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than zero"],
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: [
        "",
        "Cash",
        "Bank Transfer",
        "UPI",
        "Credit Card",
        "Debit Card",
        "Cheque",
        "Other",
      ],
      default: "",
    },

    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },

    paymentNotes: {
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
// INVOICE SCHEMA
// ===============================
const invoiceSchema = new mongoose.Schema(
  {
    // ===============================
    // INVOICE OWNER
    // ===============================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ===============================
    // CLIENT RELATIONSHIP
    // ===============================
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    // ===============================
    // CLIENT SNAPSHOT
    // ===============================
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

    // ===============================
    // INVOICE INFORMATION
    // ===============================
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

    // ===============================
    // INVOICE ITEMS
    // ===============================
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "At least one invoice item is required",
      },
    },

    // ===============================
    // FINANCIAL INFORMATION
    // ===============================
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },

    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },

    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },

    // ===============================
    // PAYMENT STATUS
    // ===============================
    status: {
      type: String,
      enum: [
        "Draft",
        "Sent",
        "Partially Paid",
        "Paid",
        "Overdue",
      ],
      default: "Draft",
    },

    // ===============================
    // PAYMENT SUMMARY
    // ===============================
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: [
        "",
        "Cash",
        "Bank Transfer",
        "UPI",
        "Credit Card",
        "Debit Card",
        "Cheque",
        "Other",
      ],
      default: "",
    },

    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },

    paymentNotes: {
      type: String,
      trim: true,
      default: "",
    },

    // ===============================
    // PAYMENT HISTORY
    // ===============================
    payments: {
      type: [paymentSchema],
      default: [],
    },

    // ===============================
    // ADDITIONAL NOTES
    // ===============================
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
  {
    user: 1,
    invoiceNumber: 1,
  },
  {
    unique: true,
  }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;