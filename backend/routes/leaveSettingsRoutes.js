const express = require('express');
const router = express.Router();
const controller = require('../controllers/leaveSettingsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Leave Settings Routes
router.get('/', controller.getLeaveSettings);
router.post('/', controller.addLeaveSetting);
router.put('/:id', controller.updateLeaveSetting);
router.delete('/:id', controller.deleteLeaveSetting);

module.exports = router;
