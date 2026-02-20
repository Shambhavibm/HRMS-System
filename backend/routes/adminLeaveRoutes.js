const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAdminLeaveRequests,
  updateLeaveStatus
} = require('../controllers/leaveRequestsController');

// ✅ GET route for fetching admin requests
router.get(
  '/admin/leave-requests',
  authenticateToken,
  authorizeRoles('admin'),
  getAdminLeaveRequests
);

// ✅ PATCH route for updating status or remarks
router.patch(
  '/admin/leave-requests/:id',
  authenticateToken,
  authorizeRoles('admin'),
  updateLeaveStatus
);

module.exports = router;
