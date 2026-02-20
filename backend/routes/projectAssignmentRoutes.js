const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getNextAssignmentId,
  createAssignment,
  viewProjects,
  getAssignedProjects,
  updateAssignment,   
  deleteAssignment,
  getProjectAssignmentByProjectId
} = require('../controllers/projectAssignmentController');

router.get('/project-assignments/next-id', authenticateToken, getNextAssignmentId);
router.post('/project-assignments', authenticateToken, createAssignment);
router.get('/project-assignments/view-projects', authenticateToken, viewProjects);
router.get('/project-assignments', authenticateToken, getAssignedProjects);
router.put('/project-assignments/:assignment_id', authenticateToken, updateAssignment);
router.delete('/project-assignments/:assignment_id', authenticateToken, deleteAssignment);
router.get('/project-assignments/by-project/:projectId', getProjectAssignmentByProjectId); //Route used to edit project

module.exports = router;
