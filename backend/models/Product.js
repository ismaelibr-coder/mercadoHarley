import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    dimensions: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    weight: {
        type: DataTypes.DECIMAL(8, 2)
    },
    description: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.STRING(100)
    },
    partType: {
        type: DataTypes.STRING(100)
    },
    partner: {
        type: DataTypes.STRING(100)
    },
    condition: {
        type: DataTypes.STRING(30)
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    profitMargin: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    featuredCarousel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    specs: {
        type: DataTypes.JSON,
        defaultValue: []
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
    tableName: 'products',
    timestamps: true,
    indexes: [
        { fields: ['category'] },
        { fields: ['stock'] }
    ]
});

export default Product;
