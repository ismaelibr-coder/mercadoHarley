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
        // A named (not boolean) unique constraint — sequelize.sync({ alter: true })
        // (dev only) doesn't reliably recognize an unnamed unique index as already
        // existing across restarts and creates a new one each time, eventually
        // hitting MySQL's 64-key-per-table limit. Naming it makes it idempotent.
        unique: 'orders_order_number_unique'
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
    // DECIMAL columns come back from mysql2/Sequelize as strings by default
    // (avoids silent float-precision loss on money at the driver level) — but
    // every consumer of an Order (API JSON responses, admin screens doing
    // arithmetic or .toFixed() on these) expects a real number, not "1190.00".
    // A custom getter normalizes at the model boundary instead of requiring
    // every call site to remember Number(order.total) — storage precision in
    // the DB is unaffected, this only changes what JS sees after a read.
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('total');
            return value === null || value === undefined ? value : parseFloat(value);
        }
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
            const value = this.getDataValue('subtotal');
            return value === null || value === undefined ? value : parseFloat(value);
        }
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        get() {
            const value = this.getDataValue('discount');
            return value === null || value === undefined ? value : parseFloat(value);
        }
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
