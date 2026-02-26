import { sequelize } from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Order from './Order.js';
import Banner from './Banner.js';
import ShippingRule from './ShippingRule.js';
import AuditLog from './AuditLog.js';

export {
    sequelize,
    User,
    Product,
    Order,
    Banner,
    ShippingRule,
    AuditLog
};

export default {
    sequelize,
    User,
    Product,
    Order,
    Banner,
    ShippingRule,
    AuditLog
};
