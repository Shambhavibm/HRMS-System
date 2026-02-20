// backend/routes/assignTaskRoutes.js
const express = require('express');
const router = express.Router();
const assignTaskController = require('../controllers/assignTaskController'); // Keep this import style
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All assign task routes require authentication
router.use(authenticateToken);

// Get all assign tasks (Managers/Members can view)
router.get('/assign-tasks', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllAssignTasks);

// Create a new assign task (Managers/Members can create under stories)
router.post('/assign-tasks', authorizeRoles('admin', 'manager', 'member'), assignTaskController.createAssignTask);

// Update assign task status (for drag-and-drop)
// Note: Frontend sends issue_id as :id in this route.
router.put('/assign-tasks/:id/status', authorizeRoles('admin', 'manager', 'member'), assignTaskController.updateAssignTaskStatus);

// --- NEW ROUTE: Update an existing assign task (e.g., description, other fields) ---
// This route uses :issue_id as the parameter, matching the frontend's PUT request.
router.put('/assign-tasks/:issue_id', authorizeRoles('admin', 'manager', 'member'), assignTaskController.updateAssignTask);
// --- END NEW ROUTE ---

// Get a single assigned task by ID
// Frontend calls: GET /api/assign-tasks/:issue_id
router.get('/assign-tasks/:issue_id', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAssignedTaskById);

// --- NEW ROUTE: Get Epic issues for a specific project ---
// Frontend calls: GET /api/epics/:projectId
router.get('/epics/:projectId', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getEpicsByProject);
// --- END NEW ROUTE ---
// NEW ROUTE: Get sub-issues for a specific parent issue (Epic)
router.get('/assign-tasks/sub-issues/:parentId', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getSubIssuesByParentId);
// Routes for Frontend Dropdown Data
router.get('/issue-types', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllIssueTypes);
router.get('/status-master', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllStatusMaster);
router.get('/projects', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllProjects);
router.get('/teams', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllTeams);
router.get('/users', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getAllUsers);
router.get('/teams/:teamId/users', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getUsersByTeam);

// Routes for Issue Details (log time and activity)
// Frontend calls: POST /api/issues/:issue_id/log-time and GET /api/issues/:issue_id/activity
// These are distinct from /assign-tasks, so they have their own full paths here.
router.post('/issues/:issue_id/log-time', authorizeRoles('admin', 'manager', 'member'), assignTaskController.logTimeForIssue);
router.get('/issues/:issue_id/activity', authorizeRoles('admin', 'manager', 'member'), assignTaskController.getIssueActivityLogs);


// You'll also define routes for:
router.delete('/assign-tasks/:id', authorizeRoles('admin', 'manager', 'member'), assignTaskController.deleteAssignTask);

module.exports = router;
