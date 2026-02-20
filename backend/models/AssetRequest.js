// backend/models/AssetRequest.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AssetRequest = sequelize.define('AssetRequest', {
    request_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    request_type: { type: DataTypes.ENUM('New Asset', 'Replacement', 'Upgrade', 'Additional', 'Repair Request', 'Onboarding'), allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    location_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'The target office location for the asset request.' },
    preferred_model: { type: DataTypes.STRING(255), allowNull: true },
    justification: { type: DataTypes.TEXT, allowNull: false },
    urgency: { type: DataTypes.ENUM('Low', 'Medium', 'High'), defaultValue: 'Medium' },
    current_status: { type: DataTypes.ENUM('Pending Manager Approval', 'Pending Secondary Approval', 'Pending Admin Approval', 'Approved', 'Rejected', 'Assigned for Fulfillment', 'Awaiting Procurement', 'Fulfilled', 'Cancelled'), defaultValue: 'Pending Manager Approval' },
    shipping_address: { type: DataTypes.TEXT, allowNull: true },
    document_path: { type: DataTypes.STRING(255), allowNull: true },
    primary_approver_id: { type: DataTypes.INTEGER, allowNull: true },
    secondary_approver_id: { type: DataTypes.INTEGER, allowNull: true },
    final_approver_id: { type: DataTypes.INTEGER, allowNull: true },
    assigned_to_resource_id: { type: DataTypes.INTEGER, allowNull: true },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    fulfilled_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    updated_by: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'asset_requests',
    timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
    paranoid: true, deletedAt: 'deleted_at',
  });

  return AssetRequest;
};