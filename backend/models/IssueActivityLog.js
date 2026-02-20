// backend/models/IssueActivityLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IssueActivityLog = sequelize.define('IssueActivityLog', {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    issue_id: { // This links to your 'assign_task' table
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assign_task', // The actual table name in your database
        key: 'issue_id',
      },
      onDelete: 'CASCADE', // IMPORTANT: If an issue is deleted, all its logs are also deleted
    },
    user_id: { // This links to your 'users_onboarded' table (who did it)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users_onboarded', // The actual table name in your database
        key: 'user_id',
      },
    },
    activity_type: { // This tells us what kind of entry it is
      type: DataTypes.ENUM('comment', 'field_change', 'time_log', 'issue_created'),
      allowNull: false,
    },
    // --- ADDED: A general description field for the activity ---
    description: {
      type: DataTypes.TEXT, // Stores the human-readable summary of the activity
      allowNull: true,      // Can be null if not immediately set or for certain types
    },
    // --- END ADDED ---
    comment_text: { // For user-written comments (specific to 'comment' type)
      type: DataTypes.TEXT,
      allowNull: true,
    },
    field_name: { // For automatic field changes (e.g., 'Status', 'Assignee') (specific to 'field_change' type)
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_value: { // What the field was before the change (specific to 'field_change' type)
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    new_value: { // What the field became after the change (specific to 'field_change' type)
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hours_logged: { // For time logging entries (specific to 'time_log' type)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    log_comment: { // Optional comment for time logging (specific to 'time_log' type)
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: { // When this log entry was created
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'issue_activity_logs', // The actual table name in your database
    timestamps: false, // We manage 'created_at' manually, so Sequelize doesn't try to add 'updatedAt'
    underscored: true, // Use snake_case (e.g., 'issue_id' instead of 'issueId')
  });

  // This part helps Sequelize understand how this table connects to others
  IssueActivityLog.associate = (models) => {
    IssueActivityLog.belongsTo(models.AssignTask, { foreignKey: 'issue_id', as: 'issue' });
    IssueActivityLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return IssueActivityLog;
};
