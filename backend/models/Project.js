const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    project_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    project_key: {
      type: DataTypes.STRING(10),
      allowNull: false, // <--- THIS MUST BE TRUE FOR THE INITIAL SYNC TO WORK WITH EXISTING DATA
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stakeholder_1: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    stakeholder_2: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    discussion_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    implemented_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ongoing_status_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Planned',
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    client_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
   website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    zipcode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
     progress_percent: {            
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true 
    },

    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organization_onboarded',
        key: 'organization_id',
      },
    },
    // --- ADDED/CONFIRMED: project_manager_id column ---
    project_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if a project doesn't have a manager yet
      references: {
        model: 'users_onboarded', // Matches the tableName of your User model
        key: 'user_id',
      },
    },
    // --- END ADDED/CONFIRMED ---
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
    tableName: 'projects',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  return Project;
};