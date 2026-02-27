import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './User.js';

export const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    orderNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.STRING(255),
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    customer: {
        type: DataTypes.JSON,
        allowNull: false
    },
    shipping: {
        type: DataTypes.JSON,
        allowNull: false
    },
    payment: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending'
    },
    method: {
        type: DataTypes.STRING(50)
    },
    sellerName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    orderType: {
        type: DataTypes.STRING(50),
        defaultValue: 'online',
        validate: {
            isIn: [['online', 'pavilhao']]
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    paidAt: {
        type: DataTypes.DATE
    },
    shippedAt: {
        type: DataTypes.DATE
    },
    deliveredAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['orderNumber'] },
        { fields: ['createdAt'] }
    ]
});

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

export default Order;
