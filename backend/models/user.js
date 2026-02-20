
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'organization_onboarded',
        key: 'organization_id',
      },
    },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    official_email_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      
      unique: true,
      validate: { isEmail: true },
    },
    secondary_email_id: {
      type: DataTypes.STRING(255),
      validate: { isEmail: true },
    },
    contact_number: { type: DataTypes.STRING(50) },
    emergency_contact_name: { type: DataTypes.STRING(255) },
    emergency_contact_number: { type: DataTypes.STRING(50) },
    emergency_contact_email: { type: DataTypes.STRING(50) },
    emergency_contact_relation: { type: DataTypes.STRING(50) },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'member'),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    invite_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    temp_password_expires: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'invited', 'pending_approval', 'suspended', 'deleted'),
      defaultValue: 'invited',
    },
    profile_picture_url: { type: DataTypes.STRING(255) },
    bio: { type: DataTypes.TEXT },

    // Demographics
    father_name: { type: DataTypes.STRING(255) },
    mother_name: { type: DataTypes.STRING(255) },
    date_of_birth: { type: DataTypes.DATEONLY },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    },
    nationality: { type: DataTypes.STRING(100) },
    marital_status: { type: DataTypes.STRING(50) },
    blood_group: { type: DataTypes.STRING(10) },
    address_line1: { type: DataTypes.STRING(255) },
    address_line2: { type: DataTypes.STRING(255) },
    city: { type: DataTypes.STRING(100) },
    state: { type: DataTypes.STRING(100) },
    zip_code: { type: DataTypes.STRING(20) },
    country: { type: DataTypes.STRING(100) },

    // Employment
    employee_id: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    date_of_joining: { type: DataTypes.DATEONLY },
    designation: { type: DataTypes.STRING(100) },
    department: { type: DataTypes.STRING(100) },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users_onboarded',
        key: 'user_id',
      },
    },
    manager_id_primary: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users_onboarded',
        key: 'user_id',
      },
    },
    manager_id_secondary: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users_onboarded',
        key: 'user_id',
      },
    },
    employment_type: {
      type: DataTypes.ENUM('Full-time', 'Part-time', 'Contractor', 'Intern'),
    },
    work_location: { type: DataTypes.STRING(255) },
    notes: { type: DataTypes.TEXT },
    about_me: { type: DataTypes.TEXT },

    // Financial
    bank_name: { type: DataTypes.STRING(255) },
    bank_account_number: { type: DataTypes.STRING(100) },
    ifsc_code: { type: DataTypes.STRING(50) },
    pan_number: { type: DataTypes.STRING(20) },
    aadhaar_number: { type: DataTypes.STRING(20) },
    voter_id: { type: DataTypes.STRING(50), unique: true },

    // Social Media
    facebook_url: { type: DataTypes.STRING(255), validate: { isUrl: true } },
    x_url: { type: DataTypes.STRING(255), validate: { isUrl: true } },
    linkedin_url: { type: DataTypes.STRING(255), validate: { isUrl: true } },
    instagram_url: { type: DataTypes.STRING(255), validate: { isUrl: true } },

    // Audit
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'users_onboarded',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  // 🔐 Password Compare
  User.prototype.comparePassword = async function (candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password_hash);
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  };

  // ✅ Associations
  User.associate = (models) => {

    User.belongsToMany(models.teams, {
      through: models.team_members,
      foreignKey: 'user_id',
      otherKey: 'team_id',
      as: 'teams',
    });

  };

  return User;
};
