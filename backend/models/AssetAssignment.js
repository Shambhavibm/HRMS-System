// backend/models/AssetAssignment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AssetAssignment = sequelize.define('AssetAssignment', {
    assignment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    request_id: { type: DataTypes.INTEGER, allowNull: true },
    asset_id: { type: DataTypes.INTEGER, allowNull: true },
    stock_id: { type: DataTypes.INTEGER, allowNull: true },
    assignment_date: { type: DataTypes.DATEONLY, allowNull: false },
    return_date: { type: DataTypes.DATEONLY, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    accessory_details: { type: DataTypes.JSON, allowNull: true, comment: 'Store details of accessories, e.g., {"charger_serial": "XYZ"}' },
    returned_condition: { type: DataTypes.ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged'), allowNull: true },
    damage_notes: { type: DataTypes.TEXT, allowNull: true },
    sign_off_status: { type: DataTypes.ENUM('Cleared', 'Cleared with Issues', 'Pending Compensation'), allowNull: true },
    received_by_id: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    updated_by: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'asset_assignments',
    timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
    paranoid: true, deletedAt: 'deleted_at',
    validate: {
      eitherAssetOrStock() {
        if (this.asset_id && this.stock_id) {
          throw new Error('An assignment cannot have both a serialized asset and a stock item.');
        }
        if (!this.asset_id && !this.stock_id) {
          throw new Error('An assignment must have either a serialized asset or a stock item.');
        }
      }
    }
  });

  return AssetAssignment;
};