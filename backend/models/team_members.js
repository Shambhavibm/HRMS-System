const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMembers = sequelize.define('team_members', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users_onboarded',
        key: 'user_id'
      }
    },
    role_in_team: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    timestamps: true,         
    paranoid: true,        
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    tableName: 'team_members'
  });

  return TeamMembers;
};