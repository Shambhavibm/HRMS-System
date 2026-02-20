const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectCost = sequelize.define('project_cost', {
    cost_id: {
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
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    added_by: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'users_onboarded',
    key: 'user_id',
  },
},
    added_on: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'project_costs',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return ProjectCost;
};
