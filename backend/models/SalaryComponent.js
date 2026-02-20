const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryComponent = sequelize.define('SalaryComponent', {
    component_id: {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., Basic Salary, Quarterly Bonus, Health Insurance',
    },
    type: {
      type: DataTypes.ENUM('earning', 'deduction', 'contribution'),
      allowNull: false,
      comment: 'Determines if it adds to or subtracts from net pay. Contribution is for employer side.',
    },
    is_system_defined: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If true, cannot be deleted by organization admins.',
    },
  }, {
    tableName: 'salary_components',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return SalaryComponent;
};