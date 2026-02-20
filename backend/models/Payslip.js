const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payslip = sequelize.define('Payslip', {
    payslip_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payslip_data: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Stores a snapshot of all earnings, deductions, and net pay for the month',
    },
    lop_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Loss of Pay days'
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to the generated PDF payslip'
    },
    generated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payslips',
    timestamps: false
  });

  return Payslip;
};