const express = require("express");
const router = express.Router();
const controller = require("../controllers/holidayController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const holidayController = require('../controllers/holidayController');
// Admin
router.post("/", authenticateToken, authorizeRoles("admin"), controller.createHoliday);
router.get("/", authenticateToken, controller.getHolidays);

// Employee/Manager
router.post(
  "/book-optional",
  authenticateToken,
  authorizeRoles("member", "manager"), // if needed
  controller.bookOptionalLeaves
);

// Admin View
router.get("/optional-bookings", authenticateToken, authorizeRoles("admin"), controller.getOptionalBookings);
router.get('/mandatory', authenticateToken, holidayController.getMandatoryHolidays);
router.get(
  "/location-based",
  authenticateToken,
  holidayController.getLocationFilteredHolidays
);
router.get(
  "/admin/all",
  authenticateToken,
  authorizeRoles("admin"),
  holidayController.getAllHolidaysForAdmin
);


module.exports = router;
