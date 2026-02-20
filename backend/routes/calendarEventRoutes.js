const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  createEvent,
  getVisibleEvents,
  bulkUploadEvents,
} = require("../controllers/calendarEventController");

const upload = multer({ dest: path.join(__dirname, "../uploads") });

router.post("/create", authenticateToken, createEvent);
router.get("/visible", authenticateToken, getVisibleEvents);

router.post(
  "/bulk-upload-events",
  authenticateToken,
  upload.single("file"),
  bulkUploadEvents
);

module.exports = router;
