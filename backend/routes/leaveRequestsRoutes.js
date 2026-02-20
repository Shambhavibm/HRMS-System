const express = require('express');
const router = express.Router();
const controller = require('../controllers/leaveRequestsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // ✅ Only once
const { getLeaveStatsForMember } = require('../controllers/leaveRequestsController');
const { getAllLeavesForAudit } = require('../controllers/leaveRequestsController');
const {
  getLeaveAnalytics,
  getAdminLeaveAnalytics,
  getManagerTeamLeaveAnalytics,
} = require('../controllers/leaveAnalyticsController');


const upload = require('../utils/multerConfig');

// Routes
router.post('/', authenticateToken, upload.single('supporting_document'), controller.applyLeave);

router.get('/upcoming', authenticateToken, controller.getUpcomingLeaves);

router.get('/mine', authenticateToken, controller.getMyLeaves);
router.get('/member/leave-stats', authenticateToken, authorizeRoles('member'), getLeaveStatsForMember);

router.get(
  '/admin/leave-requests',
  authenticateToken,
  authorizeRoles('admin'),
  controller.getAdminLeaveRequests
);

router.patch(
  '/admin/leave-requests/:id',
  authenticateToken,
  authorizeRoles('admin'),
  controller.updateLeaveStatus
);

router.get(
  '/admin/audit-leaves',
  authenticateToken,
  authorizeRoles('admin'),
  getAllLeavesForAudit
);

router.get('/admin/leave-analytics', authenticateToken, authorizeRoles('admin'), getAdminLeaveAnalytics);
router.get('/manager/leave-analytics', authenticateToken, authorizeRoles('manager'), getManagerTeamLeaveAnalytics);
router.get("/analytics", authenticateToken, getLeaveAnalytics);
module.exports = router;
