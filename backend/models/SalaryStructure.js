const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
    structure_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
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
    ctc: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Cost to Company (Annual)',
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // MAJOR CHANGE: All dynamic component values are stored here.
    component_values: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: 'Stores key-value pairs of component_id and its amount',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    revision_history: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Tracks changes to the salary structure',
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
  }, {
    tableName: 'salary_structures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
  });

  return SalaryStructure;
};