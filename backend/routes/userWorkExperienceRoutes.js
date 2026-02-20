const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const controller = require("../controllers/userWorkExperienceController");
const { authenticateToken } = require('../middleware/authMiddleware');

router.get("/:userId", controller.getWorkExperience);
router.post("/:userId", authenticateToken, upload.single("letter"), controller.addWorkExperience);
router.put("/:userId/:experienceId", authenticateToken, upload.single("letter"), controller.updateWorkExperience);

module.exports = router;
