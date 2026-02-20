const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserEducation = sequelize.define('UserEducation', {
    education_id: {
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

    // AISCE (10th)
    aisce_board: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aisce_school: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aisce_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    aisce_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // AISSCE (12th)
    aissce_board: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aissce_college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aissce_stream: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aissce_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    aissce_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Graduation
    graduation_university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     graduation_college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    graduation_stream: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     graduation_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Postgraduation
    postgraduation_university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     postgraduation_college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    postgraduation_stream: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     postgraduation_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    postgraduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Doctorate
    doctorate_university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     doctorate_college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    doctorate_stream: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     doctorate_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    doctorate_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Others
    others_education_university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     others_education_college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    others_education_stream: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
     others_education_percentage: {
      type: DataTypes.FLOAT(20),
      allowNull: true,
    },
    others_education_year: {
      type: DataTypes.INTEGER,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'user_education',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  return UserEducation;
};
