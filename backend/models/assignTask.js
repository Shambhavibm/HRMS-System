const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AssignTask = sequelize.define('AssignTask', {
    issue_id: { // PK, INT, AUTO_INCREMENT
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    issue_key: { // VARCHAR(20), NULL (initially), UNIQUE
      type: DataTypes.STRING(20), // e.g., "PROJ-001" - adjust length as needed
      allowNull: true, // <--- CRITICAL: Set to true for initial sync with existing data
      unique: true, // Ensure global uniqueness for the combined key
    },
    issue_number: { // INT, NULL (initially)
      type: DataTypes.INTEGER,
      allowNull: true, // <--- CRITICAL: Set to true for initial sync with existing data
      // Note: This is NOT globally unique, but unique per project.
      // Uniqueness per project will be handled by the controller logic.
    },
    title: { // VARCHAR(255), NOT NULL
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: { // TEXT
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issue_type_id: { // FK, INT, NOT NULL, REFERENCES issue_types(issue_type_id)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'issue_types', // Reference the new issue_types table
        key: 'issue_type_id',
      },
    },
    parent_issue_id: { // FK, INT, NULL, REFERENCES issues(issue_id) -- Self-referencing
      type: DataTypes.INTEGER,
      allowNull: true, // For sub-tasks or parent stories
      references: {
        model: 'assign_task', // Self-reference to this table
        key: 'issue_id',
      },
    },
    project_id: { // FK, INT, NOT NULL, REFERENCES projects(project_id)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects', // Reference your actual project table name
        key: 'project_id',
      },
    },
    team_id: { // FK, INT, NULL, REFERENCES teams(id) -- Corrected from team_id
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams', // Reference your actual teams table name
        key: 'id', // --- CRITICAL FIX: Reference the 'id' column of the teams table ---
      },
    },
    organization_id: { // FK, INT, NOT NULL, REFERENCES organizations(organization_id)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'organization_onboarded', // Reference your actual organization table name
        key: 'organization_id',
      },
    },
    assignee_id: { // FK, INT, NULL, REFERENCES users(user_id) -- Person assigned
      type: DataTypes.INTEGER,
      allowNull: true, // Can be unassigned
      references: {
        model: 'users_onboarded', // Reference your actual user table name
        key: 'user_id',
      },
    },
    reporter_id: { // FK, INT, NOT NULL, REFERENCES users(user_id) -- Person who created
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users_onboarded', // Reference your actual user table name
        key: 'user_id',
      },
    },
    current_status_id: { // FK, INT, NOT NULL, REFERENCES status_master(status_id)
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'status_master', // Reference the new status_master table
        key: 'status_id',
      },
    },
    priority: { // ENUM, DEFAULT 'Medium'
      type: DataTypes.ENUM('Lowest', 'Low', 'Medium', 'High', 'Highest'),
      defaultValue: 'Medium',
    },
    start_date: { // DATE -- Added
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    due_date: { // DATE
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    actual_start_date: { // DATE -- Added
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    actual_end_date: { // DATE -- Added
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    story_points: { // DECIMAL(4,1), NULL -- Updated precision
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
    },
    // --- ADDED/MODIFIED FOR TIME TRACKING ---
    original_estimate_hours: { // New field for initial estimate
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    time_spent: { // This is now explicitly 'time_logged_hours'
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    remaining_estimate_hours: { // New field for remaining estimate
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    // --- END ADDED/MODIFIED ---
    attachment_url: { // VARCHAR(255), NULL
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true, // Optional: if you store full URLs
      },
    },
    remarks: { // TEXT
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: { // TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: { // TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    deleted_at: { // TIMESTAMP, NULL
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'assign_task', // Table name
    timestamps: false, // Managed manually
    paranoid: true, // Enable soft deletes
    deletedAt: 'deleted_at',
  });

  // Define associations here if they are in this file (or in models/index.js)
  AssignTask.associate = (models) => {
    AssignTask.belongsTo(models.IssueType, { foreignKey: 'issue_type_id', as: 'issueType' });
    AssignTask.belongsTo(models.AssignTask, { foreignKey: 'parent_issue_id', as: 'parentIssue' });
    AssignTask.belongsTo(models.Project, { foreignKey: 'project_id', as: 'project' });
    AssignTask.belongsTo(models.teams, { foreignKey: 'team_id', as: 'team' });
    AssignTask.belongsTo(models.Organization, { foreignKey: 'organization_id', as: 'organization' });
    AssignTask.belongsTo(models.User, { foreignKey: 'assignee_id', as: 'assignee' });
    AssignTask.belongsTo(models.User, { foreignKey: 'reporter_id', as: 'reporter' });
    AssignTask.belongsTo(models.StatusMaster, { foreignKey: 'current_status_id', as: 'currentStatus' });
    // --- ADDED: Association to IssueActivityLog ---
    AssignTask.hasMany(models.IssueActivityLog, { foreignKey: 'issue_id', as: 'activityLogs' });
    // --- END ADDED ---
  };

  return AssignTask;
};
