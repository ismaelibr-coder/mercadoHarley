import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    subtitle: {
        type: DataTypes.STRING(500)
    },
    image: {
        type: DataTypes.STRING(500)
    },
    link: {
        type: DataTypes.STRING(500)
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
    tableName: 'banners',
    timestamps: true,
    indexes: [
        { fields: ['active'] },
        { fields: ['displayOrder'] }
    ]
});

export default Banner;
