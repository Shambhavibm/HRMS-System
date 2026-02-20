const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserWorkExperience = sequelize.define('UserWorkExperience', {
    work_experience_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

    company_name: {  // Company name
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    company_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },

    work_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    work_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    contact_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    letter: {  
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        // isUrl: true,  
      },
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'user_work_experience',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  return UserWorkExperience;
};
