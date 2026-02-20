const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectController');
const { createProject, getNextProjectId, getAllProjects, getProjectsWithDetails, getProjectDetails } = require("../controllers/projectController");
const { authenticateToken } = require('../middleware/authMiddleware');

router.post("/", authenticateToken, createProject);
router.get("/next-id", authenticateToken, getNextProjectId);
router.get("/", authenticateToken, getAllProjects);
// ✅ Get a specific project by ID
router.get("/:id", authenticateToken,  controller.getProjectById);
// Update a project
router.put('/:project_id', authenticateToken, controller.updateProject);
// Delete a project
router.delete('/:project_id', authenticateToken, controller.deleteProject);
router.get("/detailed/all", authenticateToken, controller.getProjectsWithDetails);
router.get("/detailed/:id", authenticateToken, controller.getProjectDetails);

module.exports = router;
