import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PricingConfig = sequelize.define('PricingConfig', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        defaultValue: 'default'
    },
    siteMarkupPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'site_markup_percent'
    },
    marketplaceMarkupPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'marketplace_markup_percent'
    },
    roundingStrategy: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '2_decimals',
        field: 'rounding_strategy'
    },
    updatedBy: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'updated_by'
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
    tableName: 'pricing_config',
    timestamps: true
});

export default PricingConfig;
