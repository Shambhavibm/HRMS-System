const express = require("express");
const router = express.Router();
const {
  getCities,
  addOfficeCity
} = require("../controllers/officeLocationController");
const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/authMiddleware");

// 🔒 Authenticated route to fetch active cities (for dropdowns)
router.get("/cities", authenticateToken, getCities);

// 🔐 Admin/Manager-only route to add a new city (with normalization check)
router.post(
  "/add-city",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  addOfficeCity
);

module.exports = router;
