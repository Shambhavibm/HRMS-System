// ✅ models/notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
  model: 'users_onboarded',
  key: 'user_id'
},
    },
    recipient_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
  model: 'users_onboarded',
  key: 'user_id'
},
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notification_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resource_type: {
      type: DataTypes.STRING,
    },
    read_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: false, // Since you're manually managing created_at/updated_at
  });

  // ✅ Correct associations using models.User
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'sender_user_id',
      as: 'Sender',
    });

    Notification.belongsTo(models.User, {
      foreignKey: 'recipient_user_id',
      as: 'Recipient',
    });

    Notification.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'Org',
    });
  };

  return Notification;
};
