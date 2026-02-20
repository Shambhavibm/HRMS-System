const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectProgressController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Chart Routes
router.get('/projects/weekly-progress-summary',authenticateToken,authorizeRoles('admin', 'manager', 'member'), controller.getWeeklyProgressSummary);
router.get('/projects/:id/progress-timeline', authenticateToken, authorizeRoles('admin', 'manager'), controller.getProjectProgressTimeline);

// Other routes
router.post('/projects/:id/updates', authenticateToken,authorizeRoles('member', 'manager'), controller.submitUpdate);
router.get('/updates/pending', authenticateToken,authorizeRoles('manager'), controller.getPendingUpdates);
router.patch('/updates/:id/approve', authenticateToken,authorizeRoles('manager'), controller.approveUpdate);
// route for Approval History
router.get('/updates/history', authenticateToken, authorizeRoles('admin', 'manager'), controller.getApprovalHistory);

module.exports = router;
