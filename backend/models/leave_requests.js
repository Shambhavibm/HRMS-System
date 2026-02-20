module.exports = (sequelize) => {
  const { DataTypes } = sequelize.Sequelize;

  const LeaveRequest = sequelize.define('leave_requests', {
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_type: { type: DataTypes.STRING, allowNull: false },
    approver_id: { type: DataTypes.INTEGER },
    approver_role: {
      type: DataTypes.ENUM('admin', 'manager'),
      allowNull: false
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    total_days: { type: DataTypes.INTEGER },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    current_approver_id: { type: DataTypes.INTEGER, allowNull: true },
    current_approver_role: {
      type: DataTypes.ENUM('manager', 'admin'),
      allowNull: true
    },
    approval_level: { type: DataTypes.INTEGER, allowNull: true },
    reason: { type: DataTypes.TEXT },
    supporting_document: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'leave_requests',
    timestamps: false
  });

  return LeaveRequest;
};
