const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectMilestone = sequelize.define('project_milestone', {
    milestone_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
   project_id: {
     type: DataTypes.INTEGER,
     allowNull: false,
     references: {
         model: 'projects', 
        key: 'project_id', 
     },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expected_date: {
      type: DataTypes.DATEONLY
    },
    actual_date: {
      type: DataTypes.DATEONLY
    },
    status: {
      type: DataTypes.STRING(50)
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
      type: DataTypes.DATE
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'project_milestones',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return ProjectMilestone;
};
