
const express = require("express");

const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create client
router.post("/", protect, createClient);

// Get all clients
router.get("/", protect, getClients);

// Get single client
router.get("/:id", protect, getClientById);

// Update client
router.put("/:id", protect, updateClient);

// Delete client
router.delete("/:id", protect, deleteClient);

module.exports = router;