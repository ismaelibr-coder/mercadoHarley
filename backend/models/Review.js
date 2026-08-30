import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Product } from './Product.js';

export const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    orderId: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    productId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
            model: Product,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Denormalized at write time — reviews show the buyer's name as it was when
    // they wrote it, so it doesn't silently change/disappear if the account is
    // later renamed or removed.
    userName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    comment: {
        type: DataTypes.TEXT,
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
    tableName: 'reviews',
    timestamps: true,
    indexes: [
        { fields: ['productId'] },
        // One review per product per customer — not per order, so buying the
        // same item twice doesn't let someone post two reviews for it.
        { unique: true, fields: ['userId', 'productId'], name: 'reviews_user_product_unique' }
    ]
});

export default Review;
