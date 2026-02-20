const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// ✅ Secure routes with middleware
router.get('/', authenticateToken, notificationController.getNotifications);
router.get('/unread/count', authenticateToken, notificationController.getUnreadNotificationCount);
router.patch('/:id/read', authenticateToken, notificationController.markNotificationAsRead);
router.patch('/mark-all-read', authenticateToken, notificationController.markAllNotificationsAsRead);
router.patch('/:id/archive', authenticateToken, notificationController.archiveNotification);
router.get('/preferences', authenticateToken, notificationController.getNotificationPreferences);
router.put('/preferences', authenticateToken, notificationController.updateNotificationPreferences);

module.exports = router;
