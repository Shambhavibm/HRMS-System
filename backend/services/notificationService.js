const { Notification, NotificationPreference, User } = require('../models');
const { Op } = require('sequelize');

const { sendNotificationEmail } = require('../utils/emailService');

// const { sendEmail } = require('./emailService'); // Assuming an email service exists
// const { sendSMS } = require('./smsService'); // Assuming an SMS service exists
// const { io } = require('../socket'); // Assuming Socket.IO server instance

class NotificationService {
  async createNotification({
    organizationId,
    recipientUserId,
    senderUserId = null,
    notificationType,
    title,
    message,
    resourceType = null,
    resourceId = null,
    linkUrl = null,
    priority = 'medium'
  }) {
    try {
      // Check if recipient exists within the organization
      const recipient = await User.findOne({
        where: { user_id: recipientUserId, organization_id: organizationId }
      });

      if (!recipient) {
        console.warn(`Notification: Recipient user (${recipientUserId}) not found in org ${organizationId}. Skipping.`);
        return null;
      }

      // Get user preferences (or use defaults if no preference record exists)
      const preferences = await NotificationPreference.findOne({
        where: { user_id: recipientUserId, organization_id: organizationId }
      }) || NotificationPreference.build({
        user_id: recipientUserId,
        organization_id: organizationId,
        receive_in_app: true,
        receive_email: false,
        receive_sms: false // Default to false
      }, { isNewRecord: false }); // Important for build if no record exists

      // 1. Store in DB
      const newNotification = await Notification.create({
        organization_id: organizationId,
        recipient_user_id: recipientUserId,
        sender_user_id: senderUserId,
        notification_type: notificationType,
        title,
        message,
        resource_type: resourceType,
        resource_id: resourceId,
        link_url: linkUrl,
        priority,
        read_status: false,
        is_archived: false
      });

      // 2. Deliver In-App (if preferred and WebSocket is active)
      if (preferences.receive_in_app) {
        
        console.log(`In-app notification created for user ${recipientUserId}: ${title}`);
      }

      // 3. Deliver Email (if preferred)
      if (preferences.receive_email && preferences[`${notificationType}_email`] !== false) {
        if (recipient.official_email_id) {
          await sendNotificationEmail({
            to: recipient.official_email_id,
            subject: title,
            message: message
          });
          console.log(`✅ Email sent to ${recipient.official_email_id}`);
        } else {
          console.warn(`⚠️ Cannot send email: No official_email_id for user ${recipientUserId}`);
        }
      }


      // 4. Deliver SMS (if preferred)
      if (preferences.receive_sms && preferences[`${notificationType}_sms`] !== false && recipient.phone_number) {
        
        console.log(`SMS notification queued for user ${recipientUserId} (${recipient.phone_number}): ${title}`);
      }

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
     
      return null;
    }
  }

  
  async getProjectManagers(projectId, organizationId) {
    
    console.warn("getProjectManagers method needs to be implemented based on your Project model.");
    return [];
  }
}

module.exports = new NotificationService(); // Export an instance