const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CalendarEvent = sequelize.define("CalendarEvent", {
    calendar_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users_onboarded', key: 'user_id' },
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'organization_onboarded', key: 'organization_id' },
    },
    event_level: { type: DataTypes.STRING, defaultValue: 'Normal' },
    type: { type: DataTypes.STRING, allowNull: false },
    scope: {
      type: DataTypes.ENUM('organization', 'team', 'private'),
      defaultValue: 'private',
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'teams', key: 'id' },
    },
    target_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users_onboarded', key: 'user_id' },
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'CalendarEvent',
    tableName: 'calendar_events',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
    hooks: {
      beforeValidate: (event) => {
        if (event.scope === 'team' && !event.team_id) {
          throw new Error("team_id is required for 'team' scope");
        }
        if (event.scope === 'private' && !event.target_user_id) {
          throw new Error("target_user_id is required for 'private' scope");
        }
        if (event.scope !== 'team') event.team_id = null;
        if (event.scope !== 'private') event.target_user_id = null;
      }
    }
  });

  return CalendarEvent;
};