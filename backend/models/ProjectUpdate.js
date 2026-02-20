const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectUpdate = sequelize.define('project_update', {
    update_id: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
    model: 'users_onboarded',
    key: 'user_id',
  },
},
    description: {
      type: DataTypes.TEXT
    },
    work_done: {
      type: DataTypes.TEXT
    },
    update_date: {
      type: DataTypes.DATEONLY
    },
    progress_percent: {
      type: DataTypes.INTEGER
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
         model: 'users_onboarded',
         key: 'user_id',
   },
    },
    approval_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
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
  tableName: 'project_updates',
  timestamps: true, 
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

  return ProjectUpdate;
};
