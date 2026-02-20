// backend/utils/notificationHelper.js
const { Op } = require('sequelize');
const { Notification, User } = require('../models');

/**
 * Creates and saves a notification for a user.
 */
async function createNotification({ organization_id, user_id, title, message, link = null, transaction = null }) {
    try {
        await Notification.create({
            organization_id,
            user_id,
            title,
            message,
            link,
            is_read: false
        }, { transaction });
    } catch (error) {
        // Log the error but don't let a notification failure roll back the main transaction
        console.error(`Failed to create notification for user ${user_id}:`, error);
    }
}

/**
 * Notifies all users with a specific role within an organization.
 */
async function notifyAllByRole({ organization_id, role, title, message, link = null, transaction = null, excludeUserIds = [] }) {
    try {
        const usersToNotify = await User.findAll({
            where: {
                organization_id,
                role,
                user_id: { [Op.notIn]: excludeUserIds }
            },
            attributes: ['user_id']
        });

        for (const user of usersToNotify) {
            await createNotification({
                organization_id,
                user_id: user.user_id,
                title,
                message,
                link,
                transaction
            });
        }
    } catch (error) {
        console.error(`Failed to notify all users with role ${role}:`, error);
    }
}

module.exports = { createNotification, notifyAllByRole };