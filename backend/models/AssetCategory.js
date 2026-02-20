// backend/models/AssetCategory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AssetCategory = sequelize.define('AssetCategory', {
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tracking_type: {
      type: DataTypes.ENUM('Serialized', 'Bulk'),
      allowNull: false,
      defaultValue: 'Serialized',
      comment: 'Serialized for unique items (laptops), Bulk for quantity-based items (keyboards).',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'asset_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    uniqueKeys: {
        uniqueCategoryPerOrg: {
            fields: ['organization_id', 'name']
        }
    }
  });

  return AssetCategory;
};