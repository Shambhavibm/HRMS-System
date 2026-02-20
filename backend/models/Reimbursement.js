const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reimbursement = sequelize.define('Reimbursement', {
    reimbursement_id: {
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
    category: {
      type: DataTypes.ENUM(
        'Internet Bills', 'Mobile Bills', 'Client Travel', 
        'Books/Training', 'WFH Furniture', 'Team Lunch', 
        'Team Outing', 'Team Building', 'Others'
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Processing'),
      defaultValue: 'Pending',
    },
    document_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    payroll_month: {
        type: DataTypes.STRING,
        allowNull: true
    }
  }, {
    tableName: 'reimbursements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Reimbursement;
};