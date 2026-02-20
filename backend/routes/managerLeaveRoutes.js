const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getManagerTeamLeaves,
  updateLeaveStatus,
  getManagerLeaveStats // ✅ Add this line
} = require('../controllers/leaveRequestsController');

// Routes
router.get(
  '/manager/leave-requests',
  authenticateToken,
  authorizeRoles('manager'),
  getManagerTeamLeaves
);

router.patch(
  '/manager/leave-requests/:id',
  authenticateToken,
  authorizeRoles('manager'),
  updateLeaveStatus
);


router.get(
  '/manager/leave-summary',
  authenticateToken,
  authorizeRoles('manager'),
  getManagerLeaveStats
);


module.exports = router;
