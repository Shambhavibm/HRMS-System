// backend/routes/issueActivityLogRoutes.js
const express = require('express');
const router = express.Router();
// --- FIX START ---
// Corrected path to point to 'authMiddleware.js'
const { authenticateToken } = require('../middleware/authMiddleware');
// --- FIX END ---
const issueActivityLogController = require('../controllers/issueActivityLogController');

// Route to add a new comment to an issue
router.post('/issues/:id/comments', authenticateToken, issueActivityLogController.addIssueComment);

// Route to log time on an issue
router.post('/issues/:id/log-time', authenticateToken, issueActivityLogController.logIssueTime);

// Route to get all activities and comments for a specific issue
router.get('/issues/:id/activity', authenticateToken, issueActivityLogController.getIssueActivity);

module.exports = router;
