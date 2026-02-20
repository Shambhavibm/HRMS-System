// backend/models/Asset.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Asset = sequelize.define('Asset', {
    asset_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organization_id: { type: DataTypes.INTEGER, allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    location_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'The office location where this asset is based.' },
    // --- RESTORED: UNIQUE CONSTRAINTS ---
    asset_tag: { type: DataTypes.STRING(50), unique: true, allowNull: true },
    serial_number: { type: DataTypes.STRING(100), unique: true, allowNull: true, comment: 'Can be null initially and added at time of assignment.' },
    // --- END RESTORED ---
    manufacturer: { type: DataTypes.STRING(100) },
    model: { type: DataTypes.STRING(100) },
    manufacturing_year: { type: DataTypes.INTEGER, allowNull: true },
    purchase_date: { type: DataTypes.DATEONLY },
    purchase_cost: { type: DataTypes.DECIMAL(15, 2) },
    warranty_expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
    current_status: { type: DataTypes.ENUM('Available', 'Issued', 'In Use', 'Under Repair', 'Awaiting Disposal', 'Retired', 'Lost'), defaultValue: 'Available' },
    condition: { type: DataTypes.ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged'), defaultValue: 'New' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    updated_by: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'assets',
    timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
    paranoid: true, deletedAt: 'deleted_at',
  });

  return Asset;
};
