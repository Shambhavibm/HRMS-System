const express = require('express');
const router = express.Router();
const { runCarryforward, getCarryforwardSummary} = require('../controllers/leaveCarryforwardController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/run', authenticateToken, authorizeRoles('admin'), runCarryforward);
router.get('/', authenticateToken, authorizeRoles('admin'), getCarryforwardSummary); // ✅ New route

module.exports = router;
