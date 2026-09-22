
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const clientRoutes = require("./routes/clientRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

const isProduction =
  process.env.NODE_ENV === "production";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error(
    "JWT_SECRET is missing from environment variables."
  );

  process.exit(1);
}

if (
  isProduction &&
  !process.env.CLIENT_URL
) {
  console.error(
    "CLIENT_URL is required in production."
  );

  process.exit(1);
}

connectDB();

// =====================================
// TRUST PROXY
// =====================================

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

// =====================================
// SECURITY HEADERS
// =====================================

app.use(
  helmet({
    contentSecurityPolicy: isProduction,
  })
);

// =====================================
// CORS
// =====================================

const configuredOrigins = (
  process.env.CLIENT_URL || ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = isProduction
  ? configuredOrigins
  : [
      ...new Set([
        ...configuredOrigins,
        ...developmentOrigins,
      ]),
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      // Useful for Postman, server-to-server requests,
      // health checks, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        `Blocked CORS origin: ${origin}`
      );

      return callback(
        new Error("CORS origin is not allowed.")
      );
    },

    credentials: false,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// =====================================
// BODY PARSING
// =====================================

app.use(
  express.json({
    limit: "1mb",
  })
);

// =====================================
// ROUTES
// =====================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/invoices",
  invoiceRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/clients",
  clientRoutes
);

app.use(
  "/api/uploads",
  uploadRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

// =====================================
// HEALTH CHECK
// =====================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "InvoiceAI API is healthy",
      environment:
        process.env.NODE_ENV || "development",
    });
  }
);

// =====================================
// ROOT
// =====================================

app.get("/", (req, res) => {
  res.json({
    message:
      "InvoiceAI API is running successfully 🚀",
  });
});

// =====================================
// 404 HANDLER
// =====================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: "API route not found.",
    });
  }
);

// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Global Error:",
      error
    );

    if (
      error instanceof Error &&
      error.message.includes(
        "Only JPG, PNG and WebP images are allowed"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Logo image must be smaller than 2 MB",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CORS origin is not allowed."
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Request origin is not allowed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

// =====================================
// SERVER
// =====================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );

  console.log(
    `Environment: ${
      process.env.NODE_ENV || "development"
    }`
  );

  console.log(
    `Allowed CORS origins: ${
      allowedOrigins.join(", ")
    }`
  );
});