// backend/models/OfficeLocation.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OfficeLocation = sequelize.define('OfficeLocation', {
        location_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        organization_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'e.g., Pune Head Office, Delhi Branch'
        },
        location_type: {
            type: DataTypes.ENUM('Head Office', 'Branch Office', 'Warehouse', 'Co-working Space'),
            allowNull: false,
            defaultValue: 'Branch Office'
        },
        address_line1: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        normalized_city: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Used for duplicate city name validation'
        },
        state: {
            type: DataTypes.STRING
        },
        country: {
            type: DataTypes.STRING
        },
        pincode: {
            type: DataTypes.STRING(10)
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        }
    }, {
        tableName: 'office_locations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return OfficeLocation;
};
