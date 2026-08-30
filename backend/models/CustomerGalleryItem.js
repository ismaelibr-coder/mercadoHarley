import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Backs the "Quem já roda com a SICK GRIP" grid on the home page — was a
// hardcoded array of stock photos in src/components/CustomerShowcase.jsx
// before this model existed. `caption` is optional on purpose: most rows
// migrated from the old hardcoded array are stock photos with no real
// customer attached, so they have no caption at all (see migration script).
export const CustomerGalleryItem = sequelize.define('CustomerGalleryItem', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    caption: {
        type: DataTypes.STRING(255)
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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
    tableName: 'customer_gallery_items',
    timestamps: true,
    indexes: [
        { fields: ['displayOrder'] }
    ]
});

export default CustomerGalleryItem;
