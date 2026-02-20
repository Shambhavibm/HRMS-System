const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectAssignment = sequelize.define('ProjectAssignment', {
    assignment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'project_id',
      },
    },
    assigned_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users_onboarded',
        key: 'user_id',
      },
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id',
      },
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organization_onboarded',
        key: 'organization_id',
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'project_assignments',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  return ProjectAssignment;
};
