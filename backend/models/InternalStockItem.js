import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const InternalStockItem = sequelize.define('InternalStockItem', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    unitCost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_cost'
    },
    siteSalePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'site_sale_price'
    },
    mlSalePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'ml_sale_price'
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    supplierId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'supplier_id'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'internal_stock_items',
    timestamps: true,
    indexes: [
        { fields: ['supplier_id'] },
        { fields: ['name'] },
        { fields: ['active'] }
    ]
});

export default InternalStockItem;
