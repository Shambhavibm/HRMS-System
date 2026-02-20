// backend/models/organization.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Organization = sequelize.define('Organization', {
    organization_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // RESTORED: This should be unique
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_person_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    contact_phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    website_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Trial', 'Suspended'),
      defaultValue: 'Trial',
      allowNull: false,
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscription_plan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_login_date: {
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
      onUpdate: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'organization_onboarded', // Explicitly define table name
    timestamps: false, // Managed manually
    paranoid: true, // Enable soft deletes
    deletedAt: 'deleted_at',
  });

  Organization.associate = (models) => {
  Organization.hasMany(models.User, {
    foreignKey: 'organization_id',
    as: 'users',
  });
};


  return Organization;
};
