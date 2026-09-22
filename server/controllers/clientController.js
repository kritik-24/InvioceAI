
const mongoose = require("mongoose");

const Client = require("../models/Client");
const Invoice = require("../models/Invoice");

// =====================================
// CONSTANTS
// =====================================

const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_COMPANY_LENGTH = 150;
const MAX_ADDRESS_LENGTH = 500;
const MAX_CITY_LENGTH = 100;
const MAX_STATE_LENGTH = 100;
const MAX_COUNTRY_LENGTH = 100;
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_GST_LENGTH = 20;
const MAX_NOTES_LENGTH = 2000;
const MAX_SEARCH_LENGTH = 100;

// =====================================
// HELPER FUNCTIONS
// =====================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateOptionalText = (
  value,
  fieldName,
  maxLength
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be text`;
  }

  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }

  return null;
};

const validateRequiredText = (
  value,
  fieldName,
  maxLength
) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return `${fieldName} is required`;
  }

  if (value.trim().length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }

  return null;
};

const normalizeOptionalText = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return typeof value === "string"
    ? value.trim()
    : value;
};

// =====================================
// CREATE CLIENT
// =====================================

const createClient = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      country,
      postalCode,
      gstNumber,
      notes,
    } = req.body;

    // =====================================
    // NAME
    // =====================================

    const nameError =
      validateRequiredText(
        name,
        "Client name",
        MAX_NAME_LENGTH
      );

    if (nameError) {
      return res.status(400).json({
        message: nameError,
      });
    }

    // =====================================
    // OPTIONAL FIELDS
    // =====================================

    const fieldsToValidate = [
      [
        email,
        "Email",
        MAX_EMAIL_LENGTH,
      ],
      [
        phone,
        "Phone",
        MAX_PHONE_LENGTH,
      ],
      [
        company,
        "Company",
        MAX_COMPANY_LENGTH,
      ],
      [
        address,
        "Address",
        MAX_ADDRESS_LENGTH,
      ],
      [
        city,
        "City",
        MAX_CITY_LENGTH,
      ],
      [
        state,
        "State",
        MAX_STATE_LENGTH,
      ],
      [
        country,
        "Country",
        MAX_COUNTRY_LENGTH,
      ],
      [
        postalCode,
        "Postal code",
        MAX_POSTAL_CODE_LENGTH,
      ],
      [
        gstNumber,
        "GST number",
        MAX_GST_LENGTH,
      ],
      [
        notes,
        "Notes",
        MAX_NOTES_LENGTH,
      ],
    ];

    for (const [
      value,
      fieldName,
      maxLength,
    ] of fieldsToValidate) {
      const error =
        validateOptionalText(
          value,
          fieldName,
          maxLength
        );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }
    }

    // =====================================
    // EMAIL FORMAT
    // =====================================

    if (
      typeof email === "string" &&
      email.trim()
    ) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          message:
            "Please enter a valid email address",
        });
      }
    }

    // =====================================
    // CREATE CLIENT
    // =====================================

    const client =
      await Client.create({
        user: req.user._id,

        name: name.trim(),

        email:
          normalizeOptionalText(email),

        phone:
          normalizeOptionalText(phone),

        company:
          normalizeOptionalText(company),

        address:
          normalizeOptionalText(address),

        city:
          normalizeOptionalText(city),

        state:
          normalizeOptionalText(state),

        country:
          normalizeOptionalText(country),

        postalCode:
          normalizeOptionalText(
            postalCode
          ),

        gstNumber:
          normalizeOptionalText(
            gstNumber
          ).toUpperCase(),

        notes:
          normalizeOptionalText(notes),
      });

    return res.status(201).json({
      message:
        "Client created successfully",
      client,
    });
  } catch (error) {
    console.error(
      "Create Client Error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A client with this email already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Client data failed validation",
      });
    }

    return res.status(500).json({
      message:
        "Server error while creating client",
    });
  }
};

// =====================================
// GET ALL CLIENTS
// =====================================

const getClients = async (
  req,
  res
) => {
  try {
    const rawSearch =
      req.query.search || "";

    if (
      typeof rawSearch !== "string"
    ) {
      return res.status(400).json({
        message:
          "Search must be a text value",
      });
    }

    const search =
      rawSearch.trim();

    if (
      search.length >
      MAX_SEARCH_LENGTH
    ) {
      return res.status(400).json({
        message: `Search cannot exceed ${MAX_SEARCH_LENGTH} characters`,
      });
    }

    const filter = {
      user: req.user._id,
    };

    // =====================================
    // SEARCH
    // =====================================

    if (search) {
      const safeSearch =
        escapeRegex(search);

      const searchRegex =
        new RegExp(
          safeSearch,
          "i"
        );

      filter.$or = [
        {
          name: searchRegex,
        },
        {
          email: searchRegex,
        },
        {
          company: searchRegex,
        },
        {
          phone: searchRegex,
        },
      ];
    }

    const clients =
      await Client.find(filter).sort({
        createdAt: -1,
      });

    // =====================================
    // GET INVOICE STATS IN ONE QUERY
    // =====================================

    const clientNames =
      clients.map(
        (client) => client.name
      );

    let invoiceStats = [];

    if (clientNames.length > 0) {
      invoiceStats =
        await Invoice.aggregate([
          {
            $match: {
              user: req.user._id,
              clientName: {
                $in: clientNames,
              },
            },
          },
          {
            $group: {
              _id: "$clientName",

              totalInvoices: {
                $sum: 1,
              },

              totalBilled: {
                $sum: "$total",
              },

              totalPaid: {
                $sum: "$paidAmount",
              },
            },
          },
        ]);
    }

    const statsMap =
      new Map(
        invoiceStats.map(
          (stats) => [
            stats._id,
            stats,
          ]
        )
      );

    const clientsWithStats =
      clients.map((client) => {
        const stats =
          statsMap.get(
            client.name
          ) || {
            totalInvoices: 0,
            totalBilled: 0,
            totalPaid: 0,
          };

        return {
          ...client.toObject(),

          stats: {
            totalInvoices:
              stats.totalInvoices,

            totalBilled:
              stats.totalBilled,

            totalPaid:
              stats.totalPaid,

            outstandingAmount:
              stats.totalBilled -
              stats.totalPaid,
          },
        };
      });

    return res.status(200).json({
      count:
        clientsWithStats.length,
      clients:
        clientsWithStats,
    });
  } catch (error) {
    console.error(
      "Get Clients Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching clients",
    });
  }
};

// =====================================
// GET SINGLE CLIENT
// =====================================

const getClientById = async (
  req,
  res
) => {
  try {
    if (
      !isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid client ID",
      });
    }

    const client =
      await Client.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!client) {
      return res.status(404).json({
        message:
          "Client not found",
      });
    }

    const invoices =
      await Invoice.find({
        user: req.user._id,
        clientName: client.name,
      }).sort({
        createdAt: -1,
      });

    const totalInvoices =
      invoices.length;

    const totalBilled =
      invoices.reduce(
        (sum, invoice) =>
          sum + Number(invoice.total || 0),
        0
      );

    const totalPaid =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.paidAmount || 0
          ),
        0
      );

    const outstandingAmount =
      totalBilled - totalPaid;

    return res.status(200).json({
      client,

      stats: {
        totalInvoices,
        totalBilled,
        totalPaid,
        outstandingAmount,
      },

      invoices,
    });
  } catch (error) {
    console.error(
      "Get Client Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching client",
    });
  }
};

// =====================================
// UPDATE CLIENT
// =====================================

const updateClient = async (
  req,
  res
) => {
  try {
    if (
      !isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid client ID",
      });
    }

    const client =
      await Client.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!client) {
      return res.status(404).json({
        message:
          "Client not found",
      });
    }

    const fields = [
      [
        "name",
        MAX_NAME_LENGTH,
      ],
      [
        "email",
        MAX_EMAIL_LENGTH,
      ],
      [
        "phone",
        MAX_PHONE_LENGTH,
      ],
      [
        "company",
        MAX_COMPANY_LENGTH,
      ],
      [
        "address",
        MAX_ADDRESS_LENGTH,
      ],
      [
        "city",
        MAX_CITY_LENGTH,
      ],
      [
        "state",
        MAX_STATE_LENGTH,
      ],
      [
        "country",
        MAX_COUNTRY_LENGTH,
      ],
      [
        "postalCode",
        MAX_POSTAL_CODE_LENGTH,
      ],
      [
        "gstNumber",
        MAX_GST_LENGTH,
      ],
      [
        "notes",
        MAX_NOTES_LENGTH,
      ],
    ];

    // =====================================
    // VALIDATE + UPDATE FIELDS
    // =====================================

    for (const [
      field,
      maxLength,
    ] of fields) {
      if (
        req.body[field] ===
        undefined
      ) {
        continue;
      }

      const value =
        req.body[field];

      const error =
        field === "name"
          ? validateRequiredText(
              value,
              "Client name",
              maxLength
            )
          : validateOptionalText(
              value,
              field === "gstNumber"
                ? "GST number"
                : field
                    .charAt(0)
                    .toUpperCase() +
                  field.slice(1),
              maxLength
            );

      if (error) {
        return res.status(400).json({
          message: error,
        });
      }

      client[field] =
        typeof value === "string"
          ? value.trim()
          : value;
    }

    // =====================================
    // EMAIL FORMAT
    // =====================================

    if (
      client.email
    ) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          client.email
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid email address",
        });
      }
    }

    // =====================================
    // GST NORMALIZATION
    // =====================================

    if (
      typeof client.gstNumber ===
      "string"
    ) {
      client.gstNumber =
        client.gstNumber
          .trim()
          .toUpperCase();
    }

    // =====================================
    // REQUIRED NAME
    // =====================================

    if (
      !client.name ||
      !client.name.trim()
    ) {
      return res.status(400).json({
        message:
          "Client name is required",
      });
    }

    // =====================================
    // SAVE
    // =====================================

    const updatedClient =
      await client.save();

    return res.status(200).json({
      message:
        "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error(
      "Update Client Error:",
      error.message
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A client with this email already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        message:
          "Client data failed validation",
      });
    }

    return res.status(500).json({
      message:
        "Server error while updating client",
    });
  }
};

// =====================================
// DELETE CLIENT
// =====================================

const deleteClient = async (
  req,
  res
) => {
  try {
    if (
      !isValidObjectId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid client ID",
      });
    }

    const client =
      await Client.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!client) {
      return res.status(404).json({
        message:
          "Client not found",
      });
    }

    // =====================================
    // CHECK ASSOCIATED INVOICES
    // =====================================

    const invoiceCount =
      await Invoice.countDocuments({
        user: req.user._id,
        clientName: client.name,
      });

    if (invoiceCount > 0) {
      return res.status(400).json({
        message:
          "This client cannot be deleted because invoices are associated with this client",
        invoiceCount,
      });
    }

    await client.deleteOne();

    return res.status(200).json({
      message:
        "Client deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Client Error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while deleting client",
    });
  }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};