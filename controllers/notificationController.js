const {
  Notification,
  NotificationPreference,
  User,
  Organization
} = require('../models');
const { Op } = require('sequelize');

const ensureUserContext = (req, res) => {
  if (!req.user || !req.user.user_id || !req.user.organization_id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token payload.' });
  }
  return null;
};

const unreadCountCache = {};

exports.getUnreadNotificationCount = async (req, res) => {
  const { user_id } = req.user;

  if (unreadCountCache[user_id] && Date.now() - unreadCountCache[user_id].timestamp < 30000) {
    return res.status(200).json({ success: true, count: unreadCountCache[user_id].count });
  }

  const count = await Notification.count({ /* your existing logic */ });

  unreadCountCache[user_id] = { count, timestamp: Date.now() };
  return res.status(200).json({ success: true, count });
};


// ✅ GET /api/v1/notifications
exports.getNotifications = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { user_id, organization_id } = req.user;
    const { status, type, resourceType, search, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      recipient_user_id: user_id,
      organization_id,
      is_archived: false
    };

    if (status === 'read') whereClause.read_status = true;
    else if (status === 'unread') whereClause.read_status = false;

    if (type) whereClause.notification_type = type;
    if (resourceType) whereClause.resource_type = resourceType;

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
           as: 'Recipient',
          attributes: ['user_id', 'first_name', 'last_name', 'official_email_id']
        },
        {
          model: User,
          as: 'Sender',
          attributes: ['user_id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({ success: true, data: notifications.rows, total: notifications.count });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ GET /api/v1/notifications/unread/count
exports.getUnreadNotificationCount = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { user_id, organization_id } = req.user;

    const count = await Notification.count({
      where: {
        recipient_user_id: user_id,
        organization_id,
        read_status: false,
        is_archived: false
      }
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('❌ Error fetching unread notification count:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ PATCH /api/v1/notifications/:id/read
exports.markNotificationAsRead = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { id } = req.params;
    const { user_id, organization_id } = req.user;

    const [updatedRows] = await Notification.update(
      { read_status: true },
      { where: { notification_id: id, recipient_user_id: user_id, organization_id } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or already read.' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ PATCH /api/v1/notifications/mark-all-read
exports.markAllNotificationsAsRead = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { user_id, organization_id } = req.user;

    await Notification.update(
      { read_status: true },
      {
        where: {
          recipient_user_id: user_id,
          organization_id,
          read_status: false
        }
      }
    );

    res.status(200).json({ success: true, message: 'All unread notifications marked as read.' });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ PATCH /api/v1/notifications/:id/archive
exports.archiveNotification = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { id } = req.params;
    const { user_id, organization_id } = req.user;

    const [updatedRows] = await Notification.update(
      { is_archived: true },
      { where: { notification_id: id, recipient_user_id: user_id, organization_id } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found or already archived.' });
    }

    res.status(200).json({ success: true, message: 'Notification archived.' });
  } catch (error) {
    console.error('❌ Error archiving notification:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ GET /api/v1/notifications/preferences
exports.getNotificationPreferences = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { user_id, organization_id } = req.user;

    let preferences = await NotificationPreference.findOne({
      where: { user_id, organization_id }
    });

    if (!preferences) {
      preferences = NotificationPreference.build({
        user_id,
        organization_id,
        receive_in_app: true,
        receive_email: false,
        receive_sms: false,
        task_update_email: false,
        leave_approval_in_app: true,
      });
    }

    res.status(200).json({ success: true, data: preferences });
  } catch (error) {
    console.error('❌ Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ✅ PUT /api/v1/notifications/preferences
exports.updateNotificationPreferences = async (req, res) => {
  const authError = ensureUserContext(req, res);
  if (authError) return;

  try {
    const { user_id, organization_id } = req.user;
    const updates = req.body;

    const allowedUpdates = ['receive_in_app', 'receive_email', 'receive_sms', 'task_update_email', 'leave_approval_in_app'];
    const filteredUpdates = {};

    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    await NotificationPreference.upsert(
      { ...filteredUpdates, user_id, organization_id },
      { where: { user_id, organization_id } }
    );

    const updatedPreferences = await NotificationPreference.findOne({
      where: { user_id, organization_id }
    });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('❌ Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
