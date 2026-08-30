import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Backs the "O que os clientes dizem" section on the home page — was a
// hardcoded array in src/components/Testimonials.jsx before this model
// existed. Not to be confused with the `Review` model (Review.js), which is
// the purchase-verified per-product review system shown on product pages —
// a Testimonial here is admin-entered, not tied to a specific order/product.
export const Testimonial = sequelize.define('Testimonial', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(255)
    },
    quote: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        validate: { min: 1, max: 5 }
    },
    photo: {
        type: DataTypes.STRING(500)
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
    tableName: 'testimonials',
    timestamps: true,
    indexes: [
        { fields: ['displayOrder'] }
    ]
});

export default Testimonial;
