import { sequelize } from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Order from './Order.js';
import Banner from './Banner.js';
import ShippingRule from './ShippingRule.js';
import AuditLog from './AuditLog.js';
import PricingConfig from './PricingConfig.js';
import Supplier from './Supplier.js';
import InternalStockItem from './InternalStockItem.js';

Supplier.hasMany(InternalStockItem, {
    foreignKey: 'supplierId',
    as: 'items'
});

InternalStockItem.belongsTo(Supplier, {
    foreignKey: 'supplierId',
    as: 'supplier'
});

export {
    sequelize,
    User,
    Product,
    Order,
    Banner,
    ShippingRule,
    AuditLog,
    PricingConfig,
    Supplier,
    InternalStockItem
};

export default {
    sequelize,
    User,
    Product,
    Order,
    Banner,
    ShippingRule,
    AuditLog,
    PricingConfig,
    Supplier,
    InternalStockItem
};
