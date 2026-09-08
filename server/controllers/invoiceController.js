
const Invoice = require("../models/Invoice");

// =====================================
// CREATE INVOICE
// =====================================
const createInvoice = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientAddress,
      invoiceNumber,
      issueDate,
      dueDate,
      items,
      tax,
      status,
      notes,
    } = req.body;

    // Basic validation
    if (
      !clientName ||
      !invoiceNumber ||
      !issueDate ||
      !dueDate ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Client name, invoice number, issue date, due date and at least one item are required",
      });
    }

    // Calculate item amounts and subtotal
    const processedItems = items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(item.quantity) * Number(item.rate),
    }));

    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const taxAmount = Number(tax) || 0;
    const total = subtotal + taxAmount;

    // Create invoice
    const invoice = await Invoice.create({
      user: req.user._id,
      clientName,
      clientEmail,
      clientAddress,
      invoiceNumber,
      issueDate,
      dueDate,
      items: processedItems,
      subtotal,
      tax: taxAmount,
      total,
      status: status || "Draft",
      notes,
    });

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
  console.error("Create Invoice Error:", error.message);

  // Duplicate invoice number for the same user
  if (error.code === 11000) {
    return res.status(400).json({
      message: "An invoice with this invoice number already exists",
    });
  }

  return res.status(500).json({
    message: "Server error while creating invoice",
  });
}
};

// =====================================
// GET ALL INVOICES FOR LOGGED-IN USER
// WITH OPTIONAL STATUS FILTER
// =====================================
const getInvoices = async (req, res) => {
  try {
    const filter = {
      user: req.user._id,
    };

    const status = req.query.status;

    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }

    const invoices = await Invoice.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get Invoices Error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching invoices",
    });
  }
};

// =====================================
// GET SINGLE INVOICE BY ID
// =====================================
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      invoice,
    });
  } catch (error) {
    console.error("Get Invoice Error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching invoice",
    });
  }
};

// =====================================
// UPDATE INVOICE
// =====================================
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const {
      clientName,
      clientEmail,
      clientAddress,
      invoiceNumber,
      issueDate,
      dueDate,
      items,
      tax,
      status,
      notes,
    } = req.body;

    // Update basic fields
    if (clientName !== undefined) invoice.clientName = clientName;
    if (clientEmail !== undefined) invoice.clientEmail = clientEmail;
    if (clientAddress !== undefined) invoice.clientAddress = clientAddress;
    if (invoiceNumber !== undefined) invoice.invoiceNumber = invoiceNumber;
    if (issueDate !== undefined) invoice.issueDate = issueDate;
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (status !== undefined) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;

    // Update items and recalculate totals
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "At least one invoice item is required",
        });
      }

      const processedItems = items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
      }));

      const subtotal = processedItems.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      invoice.items = processedItems;
      invoice.subtotal = subtotal;

      const taxAmount =
        tax !== undefined ? Number(tax) || 0 : invoice.tax;

      invoice.tax = taxAmount;
      invoice.total = subtotal + taxAmount;
    } else if (tax !== undefined) {
      const taxAmount = Number(tax) || 0;

      invoice.tax = taxAmount;
      invoice.total = invoice.subtotal + taxAmount;
    }

    const updatedInvoice = await invoice.save();

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Update Invoice Error:", error.message);

    return res.status(500).json({
      message: "Server error while updating invoice",
    });
  }
};

// =====================================
// DELETE INVOICE
// =====================================
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    await invoice.deleteOne();

    return res.status(200).json({
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete Invoice Error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting invoice",
    });
  }
};

// =====================================
// UPDATE INVOICE STATUS
// =====================================
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["Draft", "Sent", "Paid", "Overdue"];

    // Validate status
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Use Draft, Sent, Paid, or Overdue",
      });
    }

    // Find only the logged-in user's invoice
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Update status
    invoice.status = status;

    const updatedInvoice = await invoice.save();

    return res.status(200).json({
      message: "Invoice status updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Update Invoice Status Error:", error.message);

    return res.status(500).json({
      message: "Server error while updating invoice status",
    });
  }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================
module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
};