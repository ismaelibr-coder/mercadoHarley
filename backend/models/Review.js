import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    orderId: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // No DB-level FK to products.id on purpose: production's `products` table
    // was created with utf8mb4_unicode_ci, but a fresh table synced by
    // Sequelize gets the connection's default collation instead, and MySQL
    // refuses to create a FK across mismatched collations (error 3780) —
    // that mismatch took prod down on deploy (crash-looped on every startup
    // since sync() never completed). The column/index/lookup logic in
    // reviewService.js don't need a hard DB constraint to work correctly.
    productId: {
        type: DataTypes.STRING(255),
        allowNull: false
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
