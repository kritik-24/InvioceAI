
const mongoose = require("mongoose");

const Invoice = require("../models/Invoice");
const Client = require("../models/Client");

// =====================================
// CONSTANTS
// =====================================

const VALID_STATUSES = [
  "Draft",
  "Sent",
  "Partially Paid",
  "Paid",
  "Overdue",
];

const VALID_PAYMENT_METHODS = [
  "",
  "Cash",
  "Bank Transfer",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cheque",
  "Other",
];

const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "issueDate",
  "dueDate",
  "total",
  "invoiceNumber",
  "clientName",
];

const MAX_ITEMS = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_INVOICE_NUMBER_LENGTH = 50;
const MAX_CLIENT_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MAX_ADDRESS_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;
const MAX_PAYMENT_REFERENCE_LENGTH = 200;
const MAX_PAYMENT_NOTES_LENGTH = 1000;

// =====================================
// HELPER FUNCTIONS
// =====================================

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateText = (
  value,
  fieldName,
  maxLength,
  required = false
) => {
  if (value === undefined || value === null) {
    if (required) {
      return `${fieldName} is required`;
    }

    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  if (required && !value.trim()) {
    return `${fieldName} is required`;
  }

  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }

  return null;
};

const processInvoiceItems = (items) => {
  if (!Array.isArray(items)) {
    return {
      error: "Invoice items must be an array",
    };
  }

  if (items.length === 0) {
    return {
      error: "At least one invoice item is required",
    };
  }

  if (items.length > MAX_ITEMS) {
    return {
      error: `An invoice cannot contain more than ${MAX_ITEMS} items`,
    };
  }

  const processedItems = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      return {
        error: "Each invoice item must be a valid object",
      };
    }

    if (
      typeof item.description !== "string" ||
      !item.description.trim()
    ) {
      return {
        error: "Each item must have a description",
      };
    }

    if (
      item.description.trim().length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return {
        error: `Item description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      };
    }

    const quantity = Number(item.quantity);
    const rate = Number(item.rate);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return {
        error:
          "Each item must have a valid quantity greater than zero",
      };
    }

    if (
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      return {
        error:
          "Each item must have a valid rate greater than or equal to zero",
      };
    }

    if (quantity > 1000000) {
      return {
        error: "Item quantity is too large",
      };
    }

    if (rate > 1000000000) {
      return {
        error: "Item rate is too large",
      };
    }

    const amount = quantity * rate;

    if (!Number.isFinite(amount)) {
      return {
        error: "Invalid item amount",
      };
    }

    processedItems.push({
      description: item.description.trim(),
      quantity,
      rate,
      amount,
    });
  }

  return {
    items: processedItems,
  };
};

const calculateSubtotal = (items) =>
  items.reduce(
    (sum, item) => sum + item.amount,
    0
  );

const validateTax = (tax) => {
  if (tax === undefined || tax === null || tax === "") {
    return {
      value: 0,
    };
  }

  if (
    typeof tax === "boolean" ||
    (typeof tax === "string" && !tax.trim())
  ) {
    return {
      error: "Tax must be a valid number",
    };
  }

  const taxAmount = Number(tax);

  if (
    !Number.isFinite(taxAmount) ||
    taxAmount < 0
  ) {
    return {
      error: "Tax must be a valid non-negative number",
    };
  }

  if (taxAmount > 1000000000) {
    return {
      error: "Tax amount is too large",
    };
  }

  return {
    value: taxAmount,
  };
};

const validateInvoiceDates = (
  issueDate,
  dueDate
) => {
  if (!isValidDate(issueDate)) {
    return "Issue date must be a valid date";
  }

  if (!isValidDate(dueDate)) {
    return "Due date must be a valid date";
  }

  const issue = new Date(issueDate);
  const due = new Date(dueDate);

  if (due < issue) {
    return "Due date cannot be before the issue date";
  }

  return null;
};

// =====================================
// AUTOMATIC OVERDUE INVOICE DETECTION
// =====================================

const updateOverdueInvoices = async (userId) => {
  const today = new Date();

  await Invoice.updateMany(
    {
      user: userId,
      dueDate: { $lt: today },
      status: {
        $in: ["Sent", "Partially Paid"],
      },
      $expr: {
        $lt: ["$paidAmount", "$total"],
      },
    },
    {
      $set: {
        status: "Overdue",
      },
    }
  );
};

// =====================================
// GET CLIENT SNAPSHOT
// =====================================

const getClientSnapshot = async (
  clientId,
  userId
) => {
  if (!clientId) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(clientId)
  ) {
    return null;
  }

  return Client.findOne({
    _id: clientId,
    user: userId,
  });
};

// =====================================
// CREATE INVOICE
// =====================================

const createInvoice = async (req, res) => {
  try {
    const {
      client,
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

    // =====================================
    // BASIC VALIDATION
    // =====================================

    const invoiceNumberError = validateText(
      invoiceNumber,
      "Invoice number",
      MAX_INVOICE_NUMBER_LENGTH,
      true
    );

    if (invoiceNumberError) {
      return res.status(400).json({
        message: invoiceNumberError,
      });
    }

    const dateError = validateInvoiceDates(
      issueDate,
      dueDate
    );

    if (dateError) {
      return res.status(400).json({
        message: dateError,
      });
    }

    const notesError = validateText(
      notes,
      "Notes",
      MAX_NOTES_LENGTH
    );

    if (notesError) {
      return res.status(400).json({
        message: notesError,
      });
    }

    const clientNameError = validateText(
      clientName,
      "Client name",
      MAX_CLIENT_NAME_LENGTH
    );

    if (clientNameError) {
      return res.status(400).json({
        message: clientNameError,
      });
    }

    const clientEmailError = validateText(
      clientEmail,
      "Client email",
      MAX_EMAIL_LENGTH
    );

    if (clientEmailError) {
      return res.status(400).json({
        message: clientEmailError,
      });
    }

    const clientAddressError = validateText(
      clientAddress,
      "Client address",
      MAX_ADDRESS_LENGTH
    );

    if (clientAddressError) {
      return res.status(400).json({
        message: clientAddressError,
      });
    }

    // =====================================
    // CLIENT
    // =====================================

    let selectedClient = null;

    if (client !== undefined && client !== null && client !== "") {
      selectedClient = await getClientSnapshot(
        client,
        req.user._id
      );

      if (!selectedClient) {
        return res.status(404).json({
          message: "Selected client was not found",
        });
      }
    }

    const finalClientName =
      selectedClient?.name ||
      clientName?.trim();

    if (!finalClientName) {
      return res.status(400).json({
        message: "Client name is required",
      });
    }

    if (
      finalClientName.length >
      MAX_CLIENT_NAME_LENGTH
    ) {
      return res.status(400).json({
        message: `Client name cannot exceed ${MAX_CLIENT_NAME_LENGTH} characters`,
      });
    }

    const finalClientEmail =
      selectedClient?.email ||
      clientEmail?.trim() ||
      "";

    const finalClientAddress =
      selectedClient?.address ||
      clientAddress?.trim() ||
      "";

    // =====================================
    // ITEMS
    // =====================================

    const processedResult =
      processInvoiceItems(items);

    if (processedResult.error) {
      return res.status(400).json({
        message: processedResult.error,
      });
    }

    const processedItems =
      processedResult.items;

    // =====================================
    // TAX
    // =====================================

    const taxResult = validateTax(tax);

    if (taxResult.error) {
      return res.status(400).json({
        message: taxResult.error,
      });
    }

    const taxAmount = taxResult.value;

    // =====================================
    // FINANCIALS
    // =====================================

    const subtotal =
      calculateSubtotal(processedItems);

    const total = subtotal + taxAmount;

    if (!Number.isFinite(total)) {
      return res.status(400).json({
        message: "Invoice total is invalid",
      });
    }

    // =====================================
    // STATUS
    // =====================================

    const requestedStatus =
      status === undefined
        ? "Draft"
        : status;

    if (
      typeof requestedStatus !== "string" ||
      !VALID_STATUSES.includes(
        requestedStatus
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice status",
      });
    }

    // New invoices cannot start as paid.
    const safeStatus =
      requestedStatus === "Paid" ||
      requestedStatus === "Partially Paid"
        ? "Draft"
        : requestedStatus;

    // =====================================
    // CREATE INVOICE
    // =====================================

    const invoice = await Invoice.create({
      user: req.user._id,

      client:
        selectedClient?._id || null,

      clientName: finalClientName,
      clientEmail: finalClientEmail,
      clientAddress: finalClientAddress,

      invoiceNumber:
        invoiceNumber.trim(),

      issueDate,
      dueDate,

      items: processedItems,

      subtotal,
      tax: taxAmount,
      total,

      status: safeStatus,

      paidAmount: 0,
      paymentDate: null,
      paymentMethod: "",
      paymentReference: "",
      paymentNotes: "",
      payments: [],

      notes: notes?.trim() || "",
    });

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error(
      "Create Invoice Error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "An invoice with this invoice number already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Invoice data failed validation",
      });
    }

    return res.status(500).json({
      message:
        "Server error while creating invoice",
    });
  }
};

// =====================================
// GET ALL INVOICES
// =====================================

const getInvoices = async (req, res) => {
  try {
    await updateOverdueInvoices(
      req.user._id
    );

    const {
      status,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (
      status &&
      status !== "All"
    ) {
      if (
        typeof status !== "string" ||
        !VALID_STATUSES.includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid invoice status filter",
        });
      }

      filter.status = status;
    }

    if (typeof search !== "string") {
      return res.status(400).json({
        message: "Search must be a text value",
      });
    }

    const trimmedSearch =
      search.trim();

    if (trimmedSearch) {
      const safeSearch =
        escapeRegex(trimmedSearch);

      const searchRegex =
        new RegExp(safeSearch, "i");

      filter.$or = [
        {
          invoiceNumber:
            searchRegex,
        },
        {
          clientName:
            searchRegex,
        },
        {
          clientEmail:
            searchRegex,
        },
      ];
    }

    const selectedSortField =
      ALLOWED_SORT_FIELDS.includes(sortBy)
        ? sortBy
        : "createdAt";

    const sortOrder =
      order === "asc" ? 1 : -1;

    const invoices =
      await Invoice.find(filter)
        .populate(
          "client",
          "name email company"
        )
        .sort({
          [selectedSortField]:
            sortOrder,
        });

    return res.status(200).json({
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error(
      "Get Invoices Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching invoices",
    });
  }
};

// =====================================
// GET SINGLE INVOICE
// =====================================

const getInvoiceById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    await updateOverdueInvoices(
      req.user._id
    );

    const invoice =
      await Invoice.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).populate(
        "client",
        "name email phone company address gstNumber"
      );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      invoice,
    });
  } catch (error) {
    console.error(
      "Get Invoice Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching invoice",
    });
  }
};

// =====================================
// UPDATE INVOICE
// =====================================

const updateInvoice = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice =
      await Invoice.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const {
      client,
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

    // =====================================
    // VALIDATE TEXT FIELDS
    // =====================================

    if (clientName !== undefined) {
      const error = validateText(
        clientName,
        "Client name",
        MAX_CLIENT_NAME_LENGTH,
        true
      );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    if (clientEmail !== undefined) {
      const error = validateText(
        clientEmail,
        "Client email",
        MAX_EMAIL_LENGTH
      );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    if (clientAddress !== undefined) {
      const error = validateText(
        clientAddress,
        "Client address",
        MAX_ADDRESS_LENGTH
      );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    if (invoiceNumber !== undefined) {
      const error = validateText(
        invoiceNumber,
        "Invoice number",
        MAX_INVOICE_NUMBER_LENGTH,
        true
      );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    if (notes !== undefined) {
      const error = validateText(
        notes,
        "Notes",
        MAX_NOTES_LENGTH
      );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    // =====================================
    // UPDATE CLIENT RELATIONSHIP
    // =====================================

    if (client !== undefined) {
      if (
        client !== null &&
        client !== ""
      ) {
        const selectedClient =
          await getClientSnapshot(
            client,
            req.user._id
          );

        if (!selectedClient) {
          return res.status(404).json({
            message:
              "Selected client was not found",
          });
        }

        invoice.client =
          selectedClient._id;

        invoice.clientName =
          selectedClient.name;

        invoice.clientEmail =
          selectedClient.email || "";

        invoice.clientAddress =
          selectedClient.address || "";
      } else {
        invoice.client = null;
      }
    }

    // =====================================
    // MANUAL CLIENT SNAPSHOT
    // =====================================

    if (clientName !== undefined) {
      invoice.clientName =
        clientName.trim();
    }

    if (clientEmail !== undefined) {
      invoice.clientEmail =
        clientEmail.trim();
    }

    if (clientAddress !== undefined) {
      invoice.clientAddress =
        clientAddress.trim();
    }

    if (!invoice.clientName?.trim()) {
      return res.status(400).json({
        message: "Client name is required",
      });
    }

    // =====================================
    // INVOICE INFORMATION
    // =====================================

    if (invoiceNumber !== undefined) {
      invoice.invoiceNumber =
        invoiceNumber.trim();
    }

    if (issueDate !== undefined) {
      if (!isValidDate(issueDate)) {
        return res.status(400).json({
          message:
            "Issue date must be a valid date",
        });
      }

      invoice.issueDate =
        issueDate;
    }

    if (dueDate !== undefined) {
      if (!isValidDate(dueDate)) {
        return res.status(400).json({
          message:
            "Due date must be a valid date",
        });
      }

      invoice.dueDate =
        dueDate;
    }

    const dateError =
      validateInvoiceDates(
        invoice.issueDate,
        invoice.dueDate
      );

    if (dateError) {
      return res.status(400).json({
        message: dateError,
      });
    }

    if (notes !== undefined) {
      invoice.notes =
        notes.trim();
    }

    // =====================================
    // UPDATE ITEMS
    // =====================================

    if (items !== undefined) {
      const processedResult =
        processInvoiceItems(items);

      if (processedResult.error) {
        return res.status(400).json({
          message:
            processedResult.error,
        });
      }

      invoice.items =
        processedResult.items;

      invoice.subtotal =
        calculateSubtotal(
          processedResult.items
        );
    }

    // =====================================
    // UPDATE TAX
    // =====================================

    if (tax !== undefined) {
      const taxResult =
        validateTax(tax);

      if (taxResult.error) {
        return res.status(400).json({
          message:
            taxResult.error,
        });
      }

      invoice.tax =
        taxResult.value;
    }

    // =====================================
    // RECALCULATE TOTAL
    // =====================================

    invoice.total =
      Number(invoice.subtotal) +
      Number(invoice.tax);

    if (
      !Number.isFinite(
        invoice.total
      ) ||
      invoice.total < 0
    ) {
      return res.status(400).json({
        message:
          "Invoice total is invalid",
      });
    }

    // =====================================
    // PREVENT TOTAL BELOW PAID AMOUNT
    // =====================================

    if (
      invoice.total <
      invoice.paidAmount
    ) {
      return res.status(400).json({
        message:
          "Invoice total cannot be less than the amount already paid",
      });
    }

    // =====================================
    // MANUAL STATUS UPDATE
    // =====================================

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !VALID_STATUSES.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid invoice status",
        });
      }

      if (
        status === "Paid" &&
        invoice.paidAmount <
          invoice.total
      ) {
        return res.status(400).json({
          message:
            "Record the full payment before marking this invoice as Paid",
        });
      }

      if (
        status ===
          "Partially Paid" &&
        invoice.paidAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Please record a payment before marking this invoice as Partially Paid",
        });
      }

      invoice.status = status;
    }

    // =====================================
    // AUTOMATIC PAYMENT STATUS
    // =====================================

    if (
      invoice.paidAmount >=
        invoice.total &&
      invoice.total > 0
    ) {
      invoice.paidAmount =
        invoice.total;

      invoice.status = "Paid";
    } else if (
      invoice.paidAmount > 0
    ) {
      invoice.status =
        "Partially Paid";
    }

    const updatedInvoice =
      await invoice.save();

    return res.status(200).json({
      message:
        "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error(
      "Update Invoice Error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "An invoice with this invoice number already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invoice data failed validation",
      });
    }

    return res.status(500).json({
      message:
        "Server error while updating invoice",
    });
  }
};

// =====================================
// DELETE INVOICE
// =====================================

const deleteInvoice = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice =
      await Invoice.findOne({
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
      message:
        "Invoice deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Invoice Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while deleting invoice",
    });
  }
};

// =====================================
// UPDATE INVOICE STATUS
// =====================================

const updateInvoiceStatus = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const { status } =
      req.body;

    if (
      typeof status !== "string" ||
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid invoice status",
      });
    }

    const invoice =
      await Invoice.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (
      status === "Paid" &&
      invoice.paidAmount <
        invoice.total
    ) {
      return res.status(400).json({
        message:
          "Please record the full payment before marking this invoice as Paid",
      });
    }

    if (
      status === "Partially Paid" &&
      invoice.paidAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Please record a payment before marking this invoice as Partially Paid",
      });
    }

    invoice.status = status;

    const updatedInvoice =
      await invoice.save();

    return res.status(200).json({
      message:
        "Invoice status updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error(
      "Update Invoice Status Error:",
      error.message
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Invalid invoice data",
      });
    }

    return res.status(500).json({
      message:
        "Server error while updating invoice status",
    });
  }
};

// =====================================
// RECORD PAYMENT
// =====================================

const recordPayment = async (
  req,
  res
) => {
  try {
    const {
      amount,
      paymentDate,
      paymentMethod,
      paymentReference,
      paymentNotes,
    } = req.body;

    // =====================================
    // VALIDATE AMOUNT
    // =====================================

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return res.status(400).json({
        message:
          "Payment amount is required",
      });
    }

    const paymentAmount =
      Number(amount);

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid payment amount",
      });
    }

    if (
      paymentAmount >
      1000000000
    ) {
      return res.status(400).json({
        message:
          "Payment amount is too large",
      });
    }

    // =====================================
    // VALIDATE ID
    // =====================================

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    // =====================================
    // VALIDATE PAYMENT METHOD
    // =====================================

    if (
      paymentMethod !== undefined
    ) {
      if (
        typeof paymentMethod !==
        "string"
      ) {
        return res.status(400).json({
          message:
            "Payment method must be a valid option",
        });
      }

      if (
        !VALID_PAYMENT_METHODS.includes(
          paymentMethod
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid payment method",
        });
      }
    }

    // =====================================
    // VALIDATE REFERENCE
    // =====================================

    if (
      paymentReference !==
      undefined &&
      paymentReference !== null
    ) {
      if (
        typeof paymentReference !==
        "string"
      ) {
        return res.status(400).json({
          message:
            "Payment reference must be text",
        });
      }

      if (
        paymentReference.trim()
          .length >
        MAX_PAYMENT_REFERENCE_LENGTH
      ) {
        return res.status(400).json({
          message: `Payment reference cannot exceed ${MAX_PAYMENT_REFERENCE_LENGTH} characters`,
        });
      }
    }

    // =====================================
    // VALIDATE PAYMENT NOTES
    // =====================================

    if (
      paymentNotes !==
        undefined &&
      paymentNotes !== null
    ) {
      if (
        typeof paymentNotes !==
        "string"
      ) {
        return res.status(400).json({
          message:
            "Payment notes must be text",
        });
      }

      if (
        paymentNotes.trim()
          .length >
        MAX_PAYMENT_NOTES_LENGTH
      ) {
        return res.status(400).json({
          message: `Payment notes cannot exceed ${MAX_PAYMENT_NOTES_LENGTH} characters`,
        });
      }
    }

    // =====================================
    // VALIDATE PAYMENT DATE
    // =====================================

    let finalPaymentDate =
      new Date();

    if (paymentDate !== undefined) {
      if (
        !isValidDate(paymentDate)
      ) {
        return res.status(400).json({
          message:
            "Invalid payment date",
        });
      }

      finalPaymentDate =
        new Date(paymentDate);
    }

    // =====================================
    // FIND INVOICE
    // =====================================

    const invoice =
      await Invoice.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // =====================================
    // DRAFT INVOICES
    // =====================================

    if (
      invoice.status === "Draft"
    ) {
      return res.status(400).json({
        message:
          "Send the invoice before recording a payment",
      });
    }

    // =====================================
    // REMAINING BALANCE
    // =====================================

    const remainingAmount =
      Number(invoice.total) -
      Number(invoice.paidAmount);

    if (
      remainingAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "This invoice has already been fully paid",
      });
    }

    // =====================================
    // PREVENT OVERPAYMENT
    // =====================================

    if (
      paymentAmount >
      remainingAmount
    ) {
      return res.status(400).json({
        message: `Payment amount cannot exceed the remaining balance of ₹${remainingAmount.toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`,
      });
    }

    // =====================================
    // CREATE PAYMENT
    // =====================================

    const payment = {
      amount: paymentAmount,

      paymentDate:
        finalPaymentDate,

      paymentMethod:
        paymentMethod || "",

      paymentReference:
        typeof paymentReference ===
        "string"
          ? paymentReference.trim()
          : "",

      paymentNotes:
        typeof paymentNotes ===
        "string"
          ? paymentNotes.trim()
          : "",
    };

    // =====================================
    // ADD PAYMENT HISTORY
    // =====================================

    invoice.payments.push(
      payment
    );

    // =====================================
    // UPDATE PAYMENT SUMMARY
    // =====================================

    invoice.paidAmount =
      Number(invoice.paidAmount) +
      paymentAmount;

    // Keep latest payment fields
    // for backward compatibility.
    invoice.paymentDate =
      finalPaymentDate;

    invoice.paymentMethod =
      payment.paymentMethod;

    invoice.paymentReference =
      payment.paymentReference;

    invoice.paymentNotes =
      payment.paymentNotes;

    // =====================================
    // AUTOMATIC STATUS
    // =====================================

    if (
      invoice.paidAmount >=
      invoice.total
    ) {
      invoice.paidAmount =
        invoice.total;

      invoice.status = "Paid";
    } else {
      invoice.status =
        "Partially Paid";
    }

    const updatedInvoice =
      await invoice.save();

    const newRemainingAmount =
      Number(updatedInvoice.total) -
      Number(updatedInvoice.paidAmount);

    return res.status(200).json({
      message:
        updatedInvoice.status ===
        "Paid"
          ? "Full payment recorded successfully"
          : "Partial payment recorded successfully",

      invoice: updatedInvoice,

      payment,

      remainingAmount:
        newRemainingAmount,
    });
  } catch (error) {
    console.error(
      "Record Payment Error:",
      error.message
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Payment data failed validation",
      });
    }

    return res.status(500).json({
      message:
        "Server error while recording payment",
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
  recordPayment,
};