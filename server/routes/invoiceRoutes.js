
const express = require("express");

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  recordPayment,
} = require("../controllers/invoiceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// CREATE INVOICE
// =====================================
router.post("/", protect, createInvoice);

// =====================================
// GET ALL INVOICES
// =====================================
router.get("/", protect, getInvoices);

// =====================================
// GET SINGLE INVOICE
// =====================================
router.get("/:id", protect, getInvoiceById);

// =====================================
// UPDATE INVOICE
// =====================================
router.put("/:id", protect, updateInvoice);

// =====================================
// DELETE INVOICE
// =====================================
router.delete("/:id", protect, deleteInvoice);

// =====================================
// UPDATE INVOICE STATUS
// =====================================
router.patch("/:id/status", protect, updateInvoiceStatus);

// =====================================
// RECORD PAYMENT
// =====================================
router.post("/:id/payments", protect, recordPayment);

module.exports = router;