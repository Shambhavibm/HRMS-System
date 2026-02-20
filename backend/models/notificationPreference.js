const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationPreference = sequelize.define('NotificationPreference', {
    preference_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users_onboarded',
        key: 'user_id',
      },
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'organization_onboarded',
        key: 'organization_id',
      },
    },
    receive_in_app: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    receive_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    receive_sms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    task_update_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leave_approval_in_app: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'notification_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  NotificationPreference.associate = (models) => {
    NotificationPreference.belongsTo(models.User, { foreignKey: 'user_id' });
    NotificationPreference.belongsTo(models.Organization, { foreignKey: 'organization_id' });
  };

  return NotificationPreference;
};
