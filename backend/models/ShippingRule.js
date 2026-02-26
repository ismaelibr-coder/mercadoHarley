import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ShippingRule = sequelize.define('ShippingRule', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    states: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    minWeight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false
    },
    maxWeight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    deliveryDays: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'shipping_rules',
    timestamps: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['price'] }
    ]
});

export default ShippingRule;
