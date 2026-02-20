
const express = require("express");
const router = express.Router();
const { getEducation, saveEducation } = require("../controllers/userEducationController");
const { authenticateToken } = require('../middleware/authMiddleware');

router.get("/", authenticateToken, getEducation);
router.post("/", authenticateToken, saveEducation);

module.exports = router;
