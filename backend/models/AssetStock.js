// backend/models/AssetStock.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AssetStock = sequelize.define('AssetStock', {
        stock_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        organization_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'e.g., Dell Pro Wireless Keyboard, Welcome Joining Kit'
        },
        total_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        available_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    }, {
        tableName: 'asset_stock',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return AssetStock;
};