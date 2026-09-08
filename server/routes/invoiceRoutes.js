
const express = require("express");

const { createInvoice, getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,

 } = require("../controllers/invoiceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create invoice
router.post("/", protect, createInvoice);

// Get all invoices
router.get("/", protect, getInvoices);

// Get single invoice
router.get("/:id", protect, getInvoiceById);

// Update invoice
router.put("/:id", protect, updateInvoice); 

// Delete invoice
router.delete("/:id", protect, deleteInvoice);

// Update invoice status
router.patch("/:id/status", protect, updateInvoiceStatus);

module.exports = router;